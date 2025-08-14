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

  // --- আপনার API কী ---
  const API_KEY = 'a94b055c7a72e5dfd6e843a15193675e';
  const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

  useEffect(( ) => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationStatus('detecting');
    setLocation('Detecting location...');
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus('success');
          fetchWeatherDataByCoords(latitude, longitude);
        },
        (geoError) => {
          handleGeolocationError(geoError);
          // ফলব্যাক হিসেবে ঢাকার ডেটা দেখানো হচ্ছে
          setLocation('Dhaka, Bangladesh (Default)');
          fetchWeatherDataByCity('Dhaka');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.log('Geolocation not supported, using default location');
      setLocationStatus('fallback');
      setLocation('Dhaka, Bangladesh (Default)');
      fetchWeatherDataByCity('Dhaka');
    }
  };

  const handleGeolocationError = (error) => {
    let errorMessage = 'Could not detect your location.';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access was denied.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'The request to get user location timed out.';
        break;
      default:
        errorMessage = 'An unknown error occurred.';
        break;
    }
    console.error('Geolocation error:', errorMessage);
    setLocationStatus('fallback');
  };

  // --- API থেকে ডেটা আনার ফাংশন (অক্ষাংশ ও দ্রাঘিমাংশ দিয়ে) ---
  const fetchWeatherDataByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/weather`, {
        params: {
          lat: lat,
          lon: lon,
          appid: API_KEY,
          units: 'metric'
        }
      });
      processWeatherData(response.data);
      setLocation(`${response.data.name}, ${response.data.sys.country}`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // --- API থেকে ডেটা আনার ফাংশন (শহরের নাম দিয়ে) ---
  const fetchWeatherDataByCity = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/weather`, {
        params: {
          q: city,
          appid: API_KEY,
          units: 'metric'
        }
      });
      processWeatherData(response.data);
      setLocation(`${response.data.name}, ${response.data.sys.country}`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // --- API থেকে পাওয়া ডেটা প্রসেস করার ফাংশন ---
  const processWeatherData = (data) => {
    const processedData = {
      current: {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        icon: data.weather[0].icon,
        details: {
          feels_like: Math.round(data.main.feels_like),
          wind_speed: Math.round(data.wind.speed * 3.6), // m/s থেকে km/h
          humidity: data.main.humidity
        }
      },
      // নিচের ডেটাগুলো এখনও মক, কারণ ফ্রি API এগুলো দেয় না
      weekly: Array.from({ length: 7 }, (_, i) => ({
        day: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][i],
        temp: Math.round(data.main.temp - 3 + Math.random() * 6),
        icon: data.weather[0].icon,
        active: i === new Date().getDay() -1
      })),
      hourly: Array.from({ length: 4 }, (_, i) => ({
        time: i === 0 ? 'NOW' : new Date().getHours() + i,
        temp: Math.round(data.main.temp - 2 + Math.random() * 4),
        icon: data.weather[0].icon,
        active: i === 0
      })),
      chartData: {
        labels: ['-3h', '-2h', '-1h', 'Now', '+1h', '+2h', '+3h'],
        temperatures: Array.from({ length: 7 }, () => Math.round(data.main.temp - 4 + Math.random() * 8))
      }
    };
    setWeatherData(processedData);
  };

  const handleApiError = (err) => {
    console.error('Error fetching weather data:', err);
    if (err.response) {
      if (err.response.status === 404) {
        setError('City not found. Please check the spelling.');
      } else {
        setError(`Failed to fetch data. Server responded with ${err.response.status}.`);
      }
    } else {
      setError('Network error. Please check your connection.');
    }
  };

 const handleCitySelect = (city) => {
  // নিশ্চিত করুন যে 'city' অবজেক্টটি এবং এর প্রপার্টিগুলো বিদ্যমান
  if (city && city.value === 'current') {
    getCurrentLocation();
  } else if (city && city.label) {
    // city.label থেকে শুধুমাত্র শহরের নামটি বের করা হচ্ছে
    const cityName = city.label.split(',')[0];
    setLocationStatus('success');
    fetchWeatherDataByCity(cityName);
  } else {
    // যদি কোনো কারণে ভুল ডেটা আসে, তাহলে কনসোলে এরর দেখানো হবে
    console.error("Invalid city object received in handleCitySelect:", city);
  }
  
  setShowCitySearch(false);
};

  const openCitySearch = () => {
    setShowCitySearch(true);
    setError(null); // সার্চ খোলার সময় পুরনো এরর মুছে ফেলা হলো
  };

  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return '☁️';
    // OpenWeatherMap আইকন কোড ব্যবহার করে ইমোজি দেখানো হচ্ছে
    const iconMapping = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMapping[iconCode] || '☁️';
  };

  if (loading && !weatherData) {
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

  if (error && !weatherData) {
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

  if (!weatherData) {
    return null; // যদি কোনো ডেটা না থাকে, কিছুই রেন্ডার হবে না
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

        {/* Weekly & Hourly Forecasts (এখনও মক ডেটা ব্যবহার করছে) */}
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
        apiKey={API_KEY}
      />
    </div>
  );
}

export default App;
