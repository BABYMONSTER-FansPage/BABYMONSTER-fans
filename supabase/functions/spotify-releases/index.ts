const BABYMONSTER_SPOTIFY_ARTIST_ID = "1SIocsqdEefUTE6XKGUiVS";
const allowedOrigins = new Set([
  "https://babymonster.fans",
  "https://www.babymonster.fans",
  "https://m.babymonster.fans",
  "https://babymonster-fanspage.github.io",
]);

type SpotifyAlbum = {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  images?: Array<{ url: string; width: number; height: number }>;
  external_urls?: { spotify?: string };
  total_tracks?: number;
};

type SpotifyAlbumDetail = {
  tracks?: { items?: Array<{ name?: string }>; next?: string | null };
};

type SpotifyPage<T> = { items?: T[]; next?: string | null };

async function spotifyPageItems<T>(url: string, accessToken: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;
  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: { authorization: `Bearer ${accessToken}` } });
    const page = await response.json() as SpotifyPage<T>;
    if (!response.ok) throw new Error(`SPOTIFY_PAGE_FAILED_${response.status}`);
    items.push(...(page.items || []));
    nextUrl = page.next || null;
  }
  return items;
}

Deno.serve(async request => {
  const requestOrigin = request.headers.get("origin") || "";
  const corsOrigin = allowedOrigins.has(requestOrigin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin) ? requestOrigin : "https://babymonster.fans";
  const cors = {
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "vary": "origin",
  };
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) return Response.json({ releases: [], error: "SPOTIFY_SECRETS_MISSING" }, { headers: cors });

  try {
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "authorization": `Basic ${encodedCredentials}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error(`SPOTIFY_TOKEN_FAILED_${tokenResponse.status}`);

    const albumItems = await spotifyPageItems<SpotifyAlbum>(
      `https://api.spotify.com/v1/artists/${BABYMONSTER_SPOTIFY_ARTIST_ID}/albums?include_groups=album,single&market=TW&limit=10`,
      token.access_token,
    );

    const seen = new Set<string>();
    const uniqueAlbums = albumItems
      .filter((item: SpotifyAlbum) => {
        const key = `${item.name.toLowerCase()}|${item.release_date || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const releases = await Promise.all(uniqueAlbums.map(async (item: SpotifyAlbum) => {
      let trackNames: string[] = [];
      try {
        const albumDetailResponse = await fetch(`https://api.spotify.com/v1/albums/${item.id}?market=US`, {
          headers: { authorization: `Bearer ${token.access_token}` },
        });
        const albumDetail = await albumDetailResponse.json() as SpotifyAlbumDetail;
        if (albumDetailResponse.ok) {
          trackNames = (albumDetail.tracks?.items || [])
            .map(track => String(track.name || "").trim())
            .filter(Boolean);
          let nextTracksUrl = albumDetail.tracks?.next || null;
          while (nextTracksUrl) {
            const tracksResponse = await fetch(nextTracksUrl, { headers: { authorization: `Bearer ${token.access_token}` } });
            const tracksPage = await tracksResponse.json() as SpotifyPage<{ name?: string }>;
            if (!tracksResponse.ok) break;
            trackNames.push(...(tracksPage.items || []).map(track => String(track.name || "").trim()).filter(Boolean));
            nextTracksUrl = tracksPage.next || null;
          }
        }
      } catch {
        trackNames = [];
      }

      return {
        id: item.id,
        title: item.name,
        year: item.release_date?.slice(0, 4) || "",
        type: item.album_type === "single" ? "Single" : "Album",
        releaseDate: item.release_date || "",
        imageUrl: item.images?.[0]?.url || "",
        spotifyUrl: item.external_urls?.spotify || "",
        tracks: trackNames.length ? trackNames : [],
      };
    }));

    releases.sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)));
    return Response.json({ releases }, { headers: { ...cors, "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ releases: [], error: error instanceof Error ? error.message : "SPOTIFY_UNAVAILABLE" }, { status: 200, headers: cors });
  }
});
