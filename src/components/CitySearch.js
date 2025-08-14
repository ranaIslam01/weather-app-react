import React, { useState, useEffect } from 'react';
import './CitySearch.css';

const CitySearch = ({ isOpen, onClose, onCitySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoritesCities, setFavoritesCities] = useState([]);

  // Popular cities for quick access
  const popularCities = [
    { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
    { name: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lon: 91.7832 },
    { name: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lon: 91.8687 },
    { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 }
  ];

  useEffect(() => {
    // Load favorite cities from localStorage
    const saved = localStorage.getItem('favoriteCities');
    if (saved) {
      setFavoritesCities(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchCities();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchCities = async () => {
    setLoading(true);
    try {
      // Using a free geocoding API for city search
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchTerm}&limit=5&appid=demo`
      );
      
      // Since we don't have real API key, use mock data based on search term
      const mockResults = popularCities.filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching cities:', error);
      // Fallback to local search in popular cities
      const localResults = popularCities.filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(localResults);
    }
    setLoading(false);
  };

  const handleCitySelect = (city) => {
    onCitySelect(city.lat, city.lon, `${city.name}, ${city.country}`);
    onClose();
    setSearchTerm('');
  };

  const addToFavorites = (city) => {
    const newFavorites = [...favoritesCities, city];
    setFavoritesCities(newFavorites);
    localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
  };

  const removeFromFavorites = (cityToRemove) => {
    const newFavorites = favoritesCities.filter(city => 
      city.name !== cityToRemove.name || city.country !== cityToRemove.country
    );
    setFavoritesCities(newFavorites);
    localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
  };

  const isFavorite = (city) => {
    return favoritesCities.some(fav => 
      fav.name === city.name && fav.country === city.country
    );
  };

  const getCurrentLocationWeather = () => {
    onCitySelect(null, null, 'current');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay">
      <div className="search-modal">
        <div className="search-header">
          <h3>Search Cities</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search for a city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="search-content">
          {/* Current Location Button */}
          <div className="section">
            <button 
              className="current-location-btn"
              onClick={getCurrentLocationWeather}
            >
              <span className="location-icon">📍</span>
              <span>Use Current Location</span>
            </button>
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="section">
              <h4>Search Results</h4>
              {loading ? (
                <div className="loading-results">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="city-list">
                  {searchResults.map((city, index) => (
                    <div key={index} className="city-item">
                      <div 
                        className="city-info"
                        onClick={() => handleCitySelect(city)}
                      >
                        <span className="city-name">{city.name}</span>
                        <span className="city-country">{city.country}</span>
                      </div>
                      <button
                        className={`favorite-btn ${isFavorite(city) ? 'favorited' : ''}`}
                        onClick={() => isFavorite(city) ? removeFromFavorites(city) : addToFavorites(city)}
                      >
                        {isFavorite(city) ? '❤️' : '🤍'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">No cities found</div>
              )}
            </div>
          )}

          {/* Favorite Cities */}
          {favoritesCities.length > 0 && (
            <div className="section">
              <h4>Favorite Cities</h4>
              <div className="city-list">
                {favoritesCities.map((city, index) => (
                  <div key={index} className="city-item">
                    <div 
                      className="city-info"
                      onClick={() => handleCitySelect(city)}
                    >
                      <span className="city-name">{city.name}</span>
                      <span className="city-country">{city.country}</span>
                    </div>
                    <button
                      className="favorite-btn favorited"
                      onClick={() => removeFromFavorites(city)}
                    >
                      ❤️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Cities */}
          {!searchTerm && (
            <div className="section">
              <h4>Popular Cities</h4>
              <div className="city-list">
                {popularCities.map((city, index) => (
                  <div key={index} className="city-item">
                    <div 
                      className="city-info"
                      onClick={() => handleCitySelect(city)}
                    >
                      <span className="city-name">{city.name}</span>
                      <span className="city-country">{city.country}</span>
                    </div>
                    <button
                      className={`favorite-btn ${isFavorite(city) ? 'favorited' : ''}`}
                      onClick={() => isFavorite(city) ? removeFromFavorites(city) : addToFavorites(city)}
                    >
                      {isFavorite(city) ? '❤️' : '🤍'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitySearch;
