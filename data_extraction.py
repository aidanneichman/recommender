import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

with open("creds.txt") as f:
    secret_ls = f.readlines()
    cid = secret_ls[0][:-1]
    secret = secret_ls[1][:-1]

print(cid)
print(secret)

client_credentials_manager = SpotifyClientCredentials(client_id=cid, client_secret=secret)
sp = spotipy.Spotify(client_credentials_manager = client_credentials_manager)

playlist_link = "https://open.spotify.com/playlist/3vIUTsdxUYFB6z2DM51lnM"
playlist_URI = playlist_link.split("/")[-1].split("?")[0]

def get_tracks_by_year(start_year, end_year, limit=100):
    tracks_data = []
    for year in range(start_year, end_year + 1):
        print(f"Fetching tracks for year: {year}")
        query = f"year:{year}"
        results = sp.search(q=query, type='track', limit=limit)
        tracks = results['tracks']['items']
        for track in tracks:
            track_data = {
                'name': track['name'],
                'uri': track['uri'],
                'artist_name': track['artists'][0]['name'],
                'album_name': track['album']['name'],
                'release_date': track['album']['release_date'],
                'popularity': track['popularity']
            }
            tracks_data.append(track_data)
        # Implement pagination if needed to fetch more tracks per year
    return tracks_data

# Example usage
start_year = 1990
end_year = 2003
tracks_data = get_tracks_by_year(start_year, end_year)
df_tracks = pd.DataFrame(tracks_data)

print(df_tracks.head())


