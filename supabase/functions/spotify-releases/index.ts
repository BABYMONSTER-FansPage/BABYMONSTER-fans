const BABYMONSTER_SPOTIFY_ARTIST_ID = "1SIocsqdEefUTE6XKGUiVS";

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
  const corsOrigin = requestOrigin === "https://babymonster.fans" || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin) ? requestOrigin : "https://babymonster.fans";
  const cors = { "access-control-allow-origin": corsOrigin, "vary": "origin", "access-control-allow-headers": "authorization, apikey, content-type" };
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) return Response.json({ releases: [] }, { headers: cors });

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error("SPOTIFY_TOKEN_FAILED");

    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${BABYMONSTER_SPOTIFY_ARTIST_ID}/albums?include_groups=album,single&market=US&limit=12`, {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const albums = await albumsResponse.json();
    if (!albumsResponse.ok) throw new Error("SPOTIFY_RELEASES_FAILED");

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
  } catch {
    return Response.json({ releases: [] }, { status: 200, headers: cors });
  }
});
