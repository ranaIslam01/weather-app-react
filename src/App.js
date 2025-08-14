import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WeatherChart from './components/WeatherChart';
import CitySearch from './components/CitySearch';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState('Detecting location...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting'); // detecting, success, fallback, error
  const [showCitySearch, setShowCitySearch] = useState(false);

  // Weather API key - In production, use environment variables
  const API_KEY = 'your_openweather_api_key_here';

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationStatus('detecting');
    setLocation('Detecting location...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus('success');
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          let errorMessage = 'Unknown error';

          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown location error occurred';
              break;
          }

          console.log('Geolocation error:', errorMessage);
          setLocationStatus('fallback');

          // Fallback to default location (Dhaka, Bangladesh)
          fetchWeatherData(23.8103, 90.4125);
          setLocation('Dhaka, Bangladesh (Default)');
        },
        {
          enableHighAccuracy: false, // Set to false for better compatibility
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log('Geolocation not supported, using default location');
      setLocationStatus('fallback');
      fetchWeatherData(23.8103, 90.4125);
      setLocation('Dhaka, Bangladesh (Default)');
    }
  };

  const fetchWeatherData = async (lat, lon, shouldGetLocationName = true) => {
    try {
      setLoading(true);

      // Get location name using reverse geocoding only if needed
      if (shouldGetLocationName) {
        await getLocationName(lat, lon);
      }

      // For demo purposes, using mock data. Replace with real API call:
      // const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

      // Generate realistic data based on location
      const mockData = {
        current: {
          temp: Math.round(20 + Math.random() * 10),
          condition: ['Sunny', 'Cloudy', 'Partly Cloudy'][Math.floor(Math.random() * 3)],
          icon: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
          details: {
            feels_like: Math.round(22 + Math.random() * 8),
            wind_speed: Math.round(3 + Math.random() * 7),
            humidity: Math.round(15 + Math.random() * 30)
          }
        },
        weekly: Array.from({ length: 7 }, (_, i) => ({
          day: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][i],
          temp: Math.round(18 + Math.random() * 12),
          icon: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
          active: i === 2
        })),
        hourly: Array.from({ length: 4 }, (_, i) => ({
          time: i === 0 ? 'NOW' : String(15 + i),
          temp: Math.round(20 + Math.random() * 8),
          icon: ['sunny', 'cloudy', 'partly-cloudy'][Math.floor(Math.random() * 3)],
          active: i === 0
        })),
        chartData: {
          labels: ['12', '13', '14', '15', '16', '17', '18'],
          temperatures: Array.from({ length: 7 }, () => Math.round(18 + Math.random() * 10))
        }
      };

      setWeatherData(mockData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const getLocationName = async (lat, lon) => {
    try {
      // Using a free geocoding service
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await response.json();

      if (data && data.city && data.countryName) {
        setLocation(`${data.city}, ${data.countryName}`);
      } else {
        setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
      }
    } catch (error) {
      console.log('Error getting location name:', error);
      setLocation(`${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    }
  };

  const handleCitySelect = (lat, lon, locationName) => {
    if (lat === null && lon === null && locationName === 'current') {
      // Use current location
      getCurrentLocation();
    } else {
      // Use selected city
      setLocation(locationName);
      fetchWeatherData(lat, lon, false); // false means don't get location name again
    }
    setShowCitySearch(false);
  };

  const openCitySearch = () => {
    setShowCitySearch(true);
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      sunny: '☀️',
      cloudy: '☁️',
      'partly-cloudy': '⛅',
      rainy: '🌧️',
      snowy: '❄️'
    };
    return icons[condition] || '☁️';
  };

  if (loading) {
    return (
      <div className="app">
        <div className="weather-card">
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <h3>Getting Weather Data</h3>
              <p>Please wait while we fetch the latest information...</p>
              {locationStatus === 'detecting' && (
                <small>📍 Detecting your location</small>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="weather-card">
          <div className="error">
            <span className="error-icon">⚠️</span>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => getCurrentLocation()}>
                🔄 Try Again
              </button>
              <button onClick={openCitySearch}>
                🔍 Search City
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="weather-card">
        {/* Header */}
        <div className="header">
          <div className="location-info">
            <span className="thermometer-icon">📍</span>
            <div className="location-details">
              <span className="location-text">{location}</span>
              <span className="location-status">
                {locationStatus === 'detecting' && 'Detecting...'}
                {locationStatus === 'success' && 'Current Location'}
                {locationStatus === 'fallback' && 'Default Location'}
              </span>
            </div>
          </div>
          <button
            className="add-location-btn"
            onClick={openCitySearch}
            title="Search for a city"
          >
            <span className="search-icon">🔍</span>
          </button>
        </div>

        {/* Current Weather */}
        <div className="current-weather">
          <div className="temperature-section">
            <h1 className="temperature">{weatherData.current.temp}°</h1>
          </div>
          <div className="condition-section">
            <div className="weather-icon-large">
              {getWeatherIcon(weatherData.current.icon)}
            </div>
            <p className="condition-text">{weatherData.current.condition}</p>
          </div>
        </div>

        {/* Weather Details */}
        <div className="weather-details">
          <div className="detail-item" title="How the temperature actually feels">
            <span className="detail-icon">🌡️</span>
            <div className="detail-info">
              <span className="detail-label">Feels like</span>
              <span className="detail-value">{weatherData.current.details.feels_like}°C</span>
            </div>
          </div>
          <div className="detail-item" title="Wind speed">
            <span className="detail-icon">💨</span>
            <div className="detail-info">
              <span className="detail-label">Wind</span>
              <span className="detail-value">{weatherData.current.details.wind_speed} km/h</span>
            </div>
          </div>
          <div className="detail-item" title="Air moisture level">
            <span className="detail-icon">💧</span>
            <div className="detail-info">
              <span className="detail-label">Humidity</span>
              <span className="detail-value">{weatherData.current.details.humidity}%</span>
            </div>
          </div>
        </div>

        {/* Weekly Forecast */}
        <div className="weekly-forecast">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="week-days">
            {weatherData.weekly.map((day, index) => (
              <div
                key={index}
                className={`day-item ${day.active ? 'active' : ''}`}
                title={`${day.day}: ${day.temp}°C`}
              >
                <span className="day-name">{day.day}</span>
                <div className="day-icon">{getWeatherIcon(day.icon)}</div>
                <span className="day-temp">{day.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="hourly-forecast">
          <h3 className="section-title">Hourly Forecast</h3>
          <div className="hourly-items">
            {weatherData.hourly.map((hour, index) => (
              <div
                key={index}
                className={`hourly-item ${hour.active ? 'active' : ''}`}
                title={`${hour.time === 'NOW' ? 'Current time' : hour.time + ':00'}: ${hour.temp}°C`}
              >
                <span className="hour-time">{hour.time}</span>
                <div className="hour-icon">{getWeatherIcon(hour.icon)}</div>
                <span className="hour-temp">{hour.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Chart */}
        <div className="chart-section">
          <h3 className="section-title">Temperature Trend</h3>
          <WeatherChart data={weatherData.chartData} />
        </div>
      </div>

      {/* City Search Modal */}
      <CitySearch
        isOpen={showCitySearch}
        onClose={() => setShowCitySearch(false)}
        onCitySelect={handleCitySelect}
      />
    </div>
  );
}

export default App;
