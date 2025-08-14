import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import WeatherChart from "./components/WeatherChart";
import CitySearch from "./components/CitySearch";

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState("Detecting location...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting");
  const [showCitySearch, setShowCitySearch] = useState(false);

  const API_KEY = "a94b055c7a72e5dfd6e843a15193675e";
  const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

  useEffect(() => {
    getCurrentLocation();
  }, []);

    const fetchLocationByIp = async () => {
    console.log('Attempting IP-based geolocation as a fallback...');
    try {
      const response = await axios.get('https://ipinfo.io/json?token=76f69fb30152f6' );
      const { loc, city, country } = response.data;
      const [lat, lon] = loc.split(',');
      setLocation(`${city}, ${country} (IP Based)`);
      fetchWeatherData(parseFloat(lat), parseFloat(lon), false);
    } catch (error) {
      console.error('IP Geolocation error:', error);
      handleFinalFallback();
    }
  };
    // চূড়ান্ত ফলব্যাক ফাংশন: যদি কোনো লোকেশন পদ্ধতিই কাজ না করে
  const handleFinalFallback = () => {
    console.log('All location methods failed. Using final fallback: Dhaka, BD.');
    // একটি ডিফল্ট লোকেশন (যেমন, ঢাকা) সেট করা হচ্ছে
    setLocation('Dhaka, Bangladesh (Default)');
    setLocationStatus('fallback');
    // ঢাকার lat/lon ব্যবহার করে আবহাওয়ার ডেটা আনা হচ্ছে
    fetchWeatherData(23.8103, 90.4125, false);
  };


  const getCurrentLocation = () => {
    setLocationStatus("detecting");
    setLocation("Detecting location...");
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus("success");
          fetchWeatherDataByCoords(latitude, longitude);
        },
        (geoError) => {
          // --- পরিবর্তন ৩: console.error এর পরিবর্তে console.info ব্যবহার করা হচ্ছে ---
          console.info(
            "Browser geolocation failed. This is common. Proceeding with fallback.",
            `(${geoError.message})`
          );
          fetchLocationByIp();
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    } else {
      // --- পরিবর্তন ৪: console.log ব্যবহার করা হচ্ছে ---
      console.log(
        "Browser geolocation is not supported. Proceeding with fallback."
      );
      fetchLocationByIp();
    }
  };

  // --- বাকি কোডে কোনো পরিবর্তন নেই ---

  const fetchWeatherDataByCoords = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/weather`, {
        params: { lat, lon, appid: API_KEY, units: "metric" },
      });
      processWeatherData(response.data);
      setLocation(`${response.data.name}, ${response.data.sys.country}`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataByCity = async (city) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/weather`, {
        params: { q: city, appid: API_KEY, units: "metric" },
      });
      processWeatherData(response.data);
      setLocation(`${response.data.name}, ${response.data.sys.country}`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const processWeatherData = (data) => {
    const processedData = {
      current: {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        icon: data.weather[0].icon,
        details: {
          feels_like: Math.round(data.main.feels_like),
          wind_speed: Math.round(data.wind.speed * 3.6),
          humidity: data.main.humidity,
        },
      },
      weekly: Array.from({ length: 7 }, (_, i) => ({
        day: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"][i],
        temp: Math.round(data.main.temp - 3 + Math.random() * 6),
        icon: data.weather[0].icon,
        active: i === new Date().getDay() - 1,
      })),
      hourly: Array.from({ length: 4 }, (_, i) => ({
        time: i === 0 ? "NOW" : new Date().getHours() + i,
        temp: Math.round(data.main.temp - 2 + Math.random() * 4),
        icon: data.weather[0].icon,
        active: i === 0,
      })),
      chartData: {
        labels: ["-3h", "-2h", "-1h", "Now", "+1h", "+2h", "+3h"],
        temperatures: Array.from({ length: 7 }, () =>
          Math.round(data.main.temp - 4 + Math.random() * 8)
        ),
      },
    };
    setWeatherData(processedData);
  };

  const handleApiError = (err) => {
    console.error("API Error:", err);
    let message = "Could not fetch weather data.";
    if (err.response) {
      message =
        err.response.status === 404
          ? "City not found."
          : `Server error: ${err.response.status}`;
    } else if (err.request) {
      message = "Network error. Check your connection.";
    }
    setError(message);
  };

  const handleCitySelect = (city) => {
    if (city && city.value === "current") {
      getCurrentLocation();
    } else if (city && city.label) {
      const cityName = city.label.split(",")[0];
      setLocationStatus("success");
      fetchWeatherDataByCity(cityName);
    }
    setShowCitySearch(false);
  };

  const openCitySearch = () => {
    setShowCitySearch(true);
    setError(null);
  };

  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return "☁️";
    const iconMapping = {
      "01d": "☀️",
      "01n": "🌙",
      "02d": "⛅",
      "02n": "☁️",
      "03d": "☁️",
      "03n": "☁️",
      "04d": "☁️",
      "04n": "☁️",
      "09d": "🌧️",
      "09n": "🌧️",
      "10d": "🌦️",
      "10n": "🌧️",
      "11d": "⛈️",
      "11n": "⛈️",
      "13d": "❄️",
      "13n": "❄️",
      "50d": "🌫️",
      "50n": "🌫️",
    };
    return iconMapping[iconCode] || "☁️";
  };

  if (loading && !weatherData) {
    return (
      <div className="app">
        <div className="weather-card">
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <h3>Getting Weather Data</h3>
              <p>{location}</p>
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
            <h3>Oops! An Error Occurred</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={getCurrentLocation}>🔄 Try Again</button>
              <button onClick={openCitySearch}>🔍 Search Manually</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="app">
      <div className="weather-card">
        <div className="header">
          <div className="location-info">
            <span className="thermometer-icon">📍</span>
            <div className="location-details">
              <span className="location-text">{location}</span>
              <span className="location-status">
                {locationStatus === "success" && "Current Location"}
                {locationStatus === "fallback" && "Approximate Location"}
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
        <div className="weather-details">
          <div
            className="detail-item"
            title="How the temperature actually feels"
          >
            <span className="detail-icon">🌡️</span>
            <div className="detail-info">
              <span className="detail-label">Feels like</span>
              <span className="detail-value">
                {weatherData.current.details.feels_like}°C
              </span>
            </div>
          </div>
          <div className="detail-item" title="Wind speed">
            <span className="detail-icon">💨</span>
            <div className="detail-info">
              <span className="detail-label">Wind</span>
              <span className="detail-value">
                {weatherData.current.details.wind_speed} km/h
              </span>
            </div>
          </div>
          <div className="detail-item" title="Air moisture level">
            <span className="detail-icon">💧</span>
            <div className="detail-info">
              <span className="label">Humidity</span>
              <span className="value">
                {weatherData.current.details.humidity}%
              </span>
            </div>
          </div>
        </div>
        <div className="weekly-forecast">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="week-days">
            {weatherData.weekly.map((day, index) => (
              <div
                key={index}
                className={`day-item ${day.active ? "active" : ""}`}
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
                className={`hourly-item ${hour.active ? "active" : ""}`}
                title={`${
                  hour.time === "NOW" ? "Current time" : hour.time + ":00"
                }: ${hour.temp}°C`}
              >
                <span className="hour-time">{hour.time}</span>
                <div className="hour-icon">{getWeatherIcon(hour.icon)}</div>
                <span className="hour-temp">{hour.temp}°</span>
              </div>
            ))}
          </div>
        </div>
        <div className="chart-section">
          <h3 className="section-title">Temperature Trend</h3>
          <WeatherChart data={weatherData.chartData} />
        </div>
      </div>
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
