import React, { useState, useEffect } from 'react';
import './SearchComponent.css'; // Ensure the path to your CSS file is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faMinus, faUpload } from '@fortawesome/free-solid-svg-icons'; // Import the play, plus, minus, and upload button icons

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [currentPlayingSong, setCurrentPlayingSong] = useState(null); // Track currently playing song
  const [playlistLink, setPlaylistLink] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return setSearchResults([]);
      try {
        const response = await fetch(`http://localhost:3001/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleSelectSong = (song) => {
    const isSongSelected = selectedSongs.some(selectedSong => selectedSong.id === song.id);
    if (isSongSelected) {
      setSelectedSongs(prevSongs => prevSongs.filter(selectedSong => selectedSong.id !== song.id));
    } else {
      setSelectedSongs(prevSongs => [...prevSongs, {
        id: song.id,
        songTitle: song.name,
        artist: song.artists.map(artist => artist.name).join(', '), // Combine multiple artists if present
        albumCover: song.album.images.length > 0 ? song.album.images[0].url : null
      }]);
    }
  };
  

  const isSongSelected = (song) => {
    return selectedSongs.some(selectedSong => selectedSong.songTitle === song.songTitle);
  }

  const handlePlaySong = async (song) => {
    setCurrentPlayingSong(song); // Update currently playing song

    try {
      const response = await fetch('http://localhost:3001/play', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songId: song.id })
      });
      const data = await response.json();
      console.log(data); // Log the response from the server
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const handleDeleteSelectedSong = (song) => {
    setSelectedSongs(prevSongs => prevSongs.filter(selectedSong => selectedSong.songTitle !== song.songTitle));
  };

  // Function to extract playlist ID from the URL
  const extractPlaylistId = (playlistUrl) => {
    const matches = playlistUrl.match(/\/playlist\/(\w+)/);
    if (matches && matches.length > 1) {
      return matches[1];
    } else {
      throw new Error('Invalid playlist URL');
    }
  };

  // Function to extract relevant information from the fetched playlist tracks
  const formatPlaylistTracks = (tracks) => {
    if (!tracks || typeof tracks !== 'object') {
      console.error('Error: tracks is null or undefined');
      return [];
    }
  
    // Convert the object values into an array
    const trackArray = Object.values(tracks);
    return trackArray.map(track => ({
      albumCover: track.albumCover,
      artist: track.artist,
      songTitle: track.song
    }));
  };
  
  

  const handleCloseModal = () => {
    setShowPlaylistModal(false);
    setPlaylistLink('');
  };

  const handlePastePlaylist = async () => {
    // Extract playlist ID from the URL
    const playlistId = extractPlaylistId(playlistLink);
  
    // Fetch playlist information from the server based on the playlist ID
    try {
      const response = await fetch(`http://localhost:3001/playlists/${playlistId}`);
      const data = await response.json();
  
      // Format the playlist tracks data
      const formattedTracks = formatPlaylistTracks(data);
      console.log(formattedTracks);
  
      // Concatenate the newly uploaded playlist tracks with the existing selected songs
      setSelectedSongs(prevSongs => [...prevSongs, ...formattedTracks]);
  
      setShowPlaylistModal(false);
      setPlaylistLink('');
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  };
  
  

  const handleUploadPlaylist = () => {
    setShowPlaylistModal(true);
  };

  return (
    <div className="container">
{/* Search Area */}
<div className="search-area">
  <input
    className="searchInput"
    type="text"
    placeholder="Search for songs or artists..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  <div className="searchResults">
    {searchResults.map((track, index) => (
      <div key={index} className="searchItem item">
        {/* Check if track has an album and album has images */}
        {track.album.images && (
          <img src={track.album.images[0].url} alt={track.name} className="albumCover" />
        )}
        <div className="trackInfo">
          <div className="titleAndArtist">
            <div className="songTitle">{track.name}</div>
            <div className="artist">{track.artists.map(artist => artist.name).join(', ')}</div>
          </div>
          <div className="buttons">
            <FontAwesomeIcon
              icon={faPlay}
              className="playButton"
              onClick={() => handlePlaySong(track)}
            />
            {isSongSelected(track) ? (
              <FontAwesomeIcon
                icon={faMinus}
                className="removeButton"
                onClick={() => handleSelectSong(track)}
              />
            ) : (
              <FontAwesomeIcon
                icon={faPlus}
                className="addButton"
                onClick={() => handleSelectSong(track)}
              />
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>




      {/* Selected Songs Area */}
      <div className="selected-songs-area">
      <div className="selected-songs-header">
  <h2>Selected Songs</h2>
  <div className="uploadContainer" style={{ marginBottom: "20px" }}>
    <input
      type="text"
      value={playlistLink}
      onChange={(e) => setPlaylistLink(e.target.value)}
      placeholder="Spotify playlist link..."
      className="playlistInput"
    />
    <FontAwesomeIcon icon={faUpload} onClick={handlePastePlaylist} className="uploadButton" />
  </div>
</div>



        <div className="selected-songs">
  {selectedSongs.map((song, index) => (
    <div key={index} className="selectedItem">
      {song.albumCover && <img src={song.albumCover} alt={song.songTitle} className="albumCover" />}
      <div className="trackInfo">
        <div className="title-artist">
          <div className="songTitle">{song.songTitle}</div>
          <div className="artist">{song.artist}</div>
        </div>
        <div className="buttons">
          <FontAwesomeIcon
            icon={faPlay}
            className="playButton"
            onClick={() => handlePlaySong(song)}
          />
          <FontAwesomeIcon
            icon={faMinus}
            className="removeButton"
            onClick={() => handleDeleteSelectedSong(song)}
          />
        </div>
      </div>
    </div>
  ))}
</div>

      </div>

      {/* Playlist Upload Modal */}
      {showPlaylistModal && (
  <div className="modal">
    <div className="modal-content">
      <div className="uploadContainer">
        <input
          type="text"
          value={playlistLink}
          onChange={(e) => setPlaylistLink(e.target.value)}
          placeholder="Spotify playlist link..."
          className="playlistInput"
        />
        <FontAwesomeIcon icon={faUpload} onClick={handlePastePlaylist} className="uploadButton" />
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default SearchComponent;
