require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for development
app.use(cors());

// Spotify Web API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

// Endpoint to search for tracks
app.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const result = await spotifyApi.searchTracks(query, { limit: 10 });
    console.log(result.body.tracks.items)
    res.json(result.body.tracks.items);
  } catch (error) {
    console.error('Error searching for tracks:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to fetch playlist information
app.get('/playlists/:playlistId', async (req, res) => {
  const { playlistId } = req.params;

  try {
    // Fetch access token using client credentials grant
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    // Fetch playlist details from the Spotify API using the playlist ID
    const playlistInfo = await spotifyApi.getPlaylist(playlistId);
    
    // Check if playlistInfo is undefined or has no items
    if (!playlistInfo || !playlistInfo.body || !playlistInfo.body.tracks || !playlistInfo.body.tracks.items) {
      throw new Error('Playlist information not available');
    }

    let tracks = playlistInfo.body.tracks.items;

    // Limit the number of tracks to 25
    tracks = tracks.slice(0, 25);

    // Fetch additional details for each track
    const detailedTracks = await Promise.all(tracks.map(async (track) => {
      const trackDetails = await spotifyApi.getTrack(track.track.id);
      return trackDetails.body;
    }));

    // Extract relevant information and construct tuples
    const playlistTracks = detailedTracks.map(track => ({
      albumCover: track.album.images.length > 0 ? track.album.images[0].url : null,
      artist: track.artists.map(artist => artist.name).join(', '),
      song: track.name
    }));

    // Respond with the list of track details
    res.json(playlistTracks);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).send('Internal Server Error');
  }
});




// Endpoint to play a song
app.put('/play', async (req, res) => {
  const { songId } = req.body;

  try {
    // Fetch song details from the Spotify API using the song ID
    const songDetails = await spotifyApi.getTrack(songId);

    // Play the song on the user's active device
    await spotifyApi.play({ uris: [`spotify:track:${songId}`] });

    // Respond with the song details (optional)
    res.json(songDetails);
  } catch (error) {
    console.error('Error playing song:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
