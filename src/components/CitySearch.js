import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // axios ব্যবহার করা ভালো অভ্যাস
import './CitySearch.css';

// Props থেকে apiKey গ্রহণ করা হচ্ছে
const CitySearch = ({ isOpen, onClose, onCitySelect, apiKey }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Popular cities for quick access
  const popularCities = [
    { name: 'Dhaka', country: 'BD', lat: 23.8103, lon: 90.4125 },
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
  ];

  // localStorage থেকে ফেভারিট শহর লোড করা
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favoriteCities');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load favorites from localStorage", error);
    }
  }, []);

  // আসল API ব্যবহার করে শহর খোঁজার ফাংশন
  const searchCities = useCallback(async (query) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        'https://api.openweathermap.org/geo/1.0/direct',
        {
          params: {
            q: query,
            limit: 5,
            appid: apiKey // Props থেকে পাওয়া আসল API কী ব্যবহার করা হচ্ছে
          }
        }
       );
      // API থেকে পাওয়া ডেটাকে UI-এর জন্য ফরম্যাট করা হচ্ছে
      const formattedResults = response.data.map(city => ({
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon,
        state: city.state || ''
      }));
      setResults(formattedResults);
    } catch (error) {
      console.error("Error searching cities:", error);
      setResults([]); // এরর হলে রেজাল্ট খালি করে দেওয়া
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]); // apiKey পরিবর্তন হলে ফাংশনটি নতুন করে তৈরি হবে

  // Debouncing: ব্যবহারকারী টাইপ করা থামালে তবেই API কল হবে
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCities(searchTerm);
      } else {
        setResults([]);
      }
    }, 500); // ৫০০ মিলিসেকেন্ড অপেক্ষা করবে

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchCities]);

  const handleSelectCity = (city) => {
    // App.js-কে সঠিক ফরম্যাটে ডেটা পাঠানো হচ্ছে
    onCitySelect({
      value: `${city.lat},${city.lon}`,
      label: `${city.name}, ${city.country}`
    });
    onClose();
  };

  const handleSelectCurrentLocation = () => {
    onCitySelect({ value: 'current', label: 'Current Location' });
    onClose();
  };

  // ফেভারিট শহর যোগ বা حذف করার ফাংশন
  const toggleFavorite = (city) => {
    let newFavorites;
    if (isFavorite(city)) {
      newFavorites = favorites.filter(fav => fav.name !== city.name || fav.country !== city.country);
    } else {
      newFavorites = [...favorites, city];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
  };

  const isFavorite = (city) => {
    return favorites.some(fav => fav.name === city.name && fav.country === city.country);
  };

  if (!isOpen) return null;

  // UI রেন্ডার করার জন্য একটি Helper ফাংশন
  const renderCityList = (cities, listType) => (
    <div className="city-list">
      {cities.map((city, index) => (
        <div key={`${listType}-${index}`} className="city-item">
          <div className="city-info" onClick={() => handleSelectCity(city)}>
            <span className="city-name">{city.name}</span>
            <span className="city-country">{city.state ? `${city.state}, ` : ''}{city.country}</span>
          </div>
          <button
            className={`favorite-btn ${isFavorite(city) ? 'favorited' : ''}`}
            onClick={() => toggleFavorite(city)}
            title={isFavorite(city) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite(city) ? '❤️' : '🤍'}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <h3>Search for a Location</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="e.g., London, New York..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            autoFocus
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="search-content">
          <div className="section">
            <button className="current-location-btn" onClick={handleSelectCurrentLocation}>
              <span className="location-icon">📍</span>
              <span>Use Current Location</span>
            </button>
          </div>

          {searchTerm ? (
            <div className="section">
              <h4>Search Results</h4>
              {isLoading ? <div className="loading-results">Searching...</div> :
               results.length > 0 ? renderCityList(results, 'search') :
               <div className="no-results">No cities found for "{searchTerm}"</div>
              }
            </div>
          ) : (
            <>
              {favorites.length > 0 && (
                <div className="section">
                  <h4>Favorites</h4>
                  {renderCityList(favorites, 'fav')}
                </div>
              )}
              <div className="section">
                <h4>Popular Cities</h4>
                {renderCityList(popularCities, 'popular')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitySearch;
