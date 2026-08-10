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

    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${BABYMONSTER_SPOTIFY_ARTIST_ID}/albums?include_groups=album,single&market=US&limit=10`, {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const albums = await albumsResponse.json();
    if (!albumsResponse.ok) throw new Error(`SPOTIFY_RELEASES_FAILED_${albumsResponse.status}`);

    const seen = new Set<string>();
    const releases = (albums.items || [])
      .filter((item: SpotifyAlbum) => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((item: SpotifyAlbum) => ({
        id: item.id,
        title: item.name,
        year: item.release_date?.slice(0, 4) || "",
        type: item.album_type === "single" ? "Single" : "Album",
        releaseDate: item.release_date || "",
        imageUrl: item.images?.[0]?.url || "",
        spotifyUrl: item.external_urls?.spotify || "",
        tracks: item.total_tracks ? [`${item.total_tracks} tracks`] : [],
      }));

    return Response.json({ releases }, { headers: { ...cors, "cache-control": "public, max-age=3600" } });
  } catch (error) {
    return Response.json({ releases: [], error: error instanceof Error ? error.message : "SPOTIFY_UNAVAILABLE" }, { status: 200, headers: cors });
  }
});
