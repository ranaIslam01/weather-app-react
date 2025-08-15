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

  // গুরুত্বপূর্ণ: এই API কী সম্ভবত আর কাজ করবে না। আপনাকে নতুন কী ব্যবহার করতে হবে।
  const API_KEY = "a94b055c7a72e5dfd6e843a15193675e"; 
  const API_BASE_URL = "https://api.openweathermap.org/data/2.5";

  useEffect(( ) => {
    // অ্যাপ চালু হওয়ার সাথে সাথে ব্যবহারকারীর লোকেশন পাওয়ার চেষ্টা করবে
    getCurrentLocation();
  }, []);

  // লোকেশন পাওয়ার সম্পূর্ণ প্রক্রিয়া পরিচালনা করার জন্য ফাংশন
  const getCurrentLocation = () => {
    setLocationStatus("detecting");
    setLocation("Detecting location...");
    setLoading(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // ব্রাউজার থেকে লোকেশন পাওয়া গেলে
          const { latitude, longitude } = position.coords;
          setLocationStatus("success");
          fetchWeatherDataByCoords(latitude, longitude);
        },
        (geoError) => {
          // ব্রাউজার থেকে লোকেশন না পাওয়া গেলে (সাধারণ ঘটনা)
          console.info(
            "Browser geolocation failed. Proceeding with IP-based fallback.",
            `(${geoError.message})`
          );
          fetchLocationByIp(); // ফলব্যাক হিসেবে আইপি (IP) দিয়ে লোকেশন খোঁজা হবে
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      // ব্রাউজারে জিওলোকেশন সাপোর্ট না করলে
      console.log("Browser geolocation is not supported. Proceeding with fallback.");
      fetchLocationByIp();
    }
  };

  // --- সমাধান: fetchWeatherData ফাংশনটিকে দুটি ভাগে ভাগ করা হয়েছে ---

  // ১. কো-অর্ডিনেট (Latitude, Longitude) দিয়ে আবহাওয়ার ডেটা আনার ফাংশন
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

  // ২. শহরের নাম দিয়ে আবহাওয়ার ডেটা আনার ফাংশন
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

  // ফলব্যাক: আইপি (IP) অ্যাড্রেস দিয়ে লোকেশন বের করার ফাংশন
  const fetchLocationByIp = async () => {
    console.log('Attempting IP-based geolocation...');
    try {
      const response = await axios.get('https://ipinfo.io/json?token=76f69fb30152f6' );
      const { loc, city, country } = response.data;
      const [lat, lon] = loc.split(',');
      setLocation(`${city}, ${country} (IP Based)`);
      setLocationStatus('fallback');
      // --- সমাধান: এখানে সঠিক ফাংশন (fetchWeatherDataByCoords) কল করা হয়েছে ---
      fetchWeatherDataByCoords(parseFloat(lat), parseFloat(lon)); 
    } catch (error) {
      console.error('IP Geolocation error:', error);
      handleFinalFallback(); // আইপি দিয়েও কাজ না হলে চূড়ান্ত ফলব্যাক
    }
  };

  // চূড়ান্ত ফলব্যাক: ডিফল্ট লোকেশন (ঢাকা) ব্যবহার করা
  const handleFinalFallback = () => {
    console.log('All location methods failed. Using final fallback: Dhaka, BD.');
    setLocation('Dhaka, Bangladesh (Default)');
    setLocationStatus('fallback');
    // --- সমাধান: এখানেও সঠিক ফাংশন (fetchWeatherDataByCoords) কল করা হয়েছে ---
    fetchWeatherDataByCoords(23.8103, 90.4125); // ঢাকার কো-অর্ডিনেট
  };

  // API থেকে পাওয়া ডেটা প্রসেস করার ফাংশন (এখানে কোনো পরিবর্তন নেই)
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
      // Weekly এবং Hourly ডেটা বর্তমানে ডামি হিসেবে তৈরি হচ্ছে
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

  // API এরর হ্যান্ডেল করার ফাংশন
  const handleApiError = (err) => {
    console.error("API Error:", err);
    let message = "Could not fetch weather data.";
    if (err.response) {
      // --- গুরুত্বপূর্ণ নোট ---
      // যদি আপনি নতুন API কী ব্যবহার না করেন, তাহলে এখানে 401 এরর পাবেন।
      if (err.response.status === 401) {
        message = "API Key is invalid. Please get a new one from OpenWeatherMap.";
      } else {
        message =
          err.response.status === 404
            ? "City not found."
            : `Server error: ${err.response.status}`;
      }
    } else if (err.request) {
      message = "Network error. Check your connection.";
    }
    setError(message);
  };

  // শহর সিলেক্ট করার ফাংশন
  const handleCitySelect = (city) => {
    if (city && city.value === "current") {
      getCurrentLocation();
    } else if (city && city.label) {
      const cityName = city.label.split(",")[0];
      setLocationStatus("success");
      fetchWeatherDataByCity(cityName); // শহরের নাম দিয়ে ডেটা আনা হবে
    }
    setShowCitySearch(false);
  };

  // বাকি JSX এবং Helper ফাংশন অপরিবর্তিত থাকবে
  const openCitySearch = () => setShowCitySearch(true);

  const getWeatherIcon = (iconCode) => {
    if (!iconCode) return "☁️";
    const iconMapping = {
      "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "☁️", "03d": "☁️",
      "03n": "☁️", "04d": "☁️", "04n": "☁️", "09d": "🌧️", "09n": "🌧️",
      "10d": "🌦️", "10n": "🌧️", "11d": "⛈️", "11n": "⛈️", "13d": "❄️",
      "13n": "❄️", "50d": "🌫️", "50n": "🌫️",
    };
    return iconMapping[iconCode] || "☁️";
  };

  // --- UI রেন্ডারিং ---
  if (loading && !weatherData) {
    return (
      <div className="app"><div className="weather-card"><div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text"><h3>Getting Weather Data</h3><p>{location}</p></div>
      </div></div></div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="app"><div className="weather-card"><div className="error">
        <span className="error-icon">⚠️</span><h3>Oops! An Error Occurred</h3><p>{error}</p>
        <div className="error-actions">
          <button onClick={getCurrentLocation}>🔄 Try Again</button>
          <button onClick={openCitySearch}>🔍 Search Manually</button>
        </div>
      </div></div></div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="app">
      <div className="weather-card">
        {/* ... আপনার বাকি JSX কোড এখানে অপরিবর্তিত থাকবে ... */}
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
          <button className="add-location-btn" onClick={openCitySearch} title="Search for a city">
            <span className="search-icon">🔍</span>
          </button>
        </div>
        <div className="current-weather">
          <div className="temperature-section"><h1 className="temperature">{weatherData.current.temp}°</h1></div>
          <div className="condition-section">
            <div className="weather-icon-large">{getWeatherIcon(weatherData.current.icon)}</div>
            <p className="condition-text">{weatherData.current.condition}</p>
          </div>
        </div>
        <div className="weather-details">
          <div className="detail-item" title="How the temperature actually feels">
            <span className="detail-icon">🌡️</span><div className="detail-info">
              <span className="detail-label">Feels like</span>
              <span className="detail-value">{weatherData.current.details.feels_like}°C</span>
            </div>
          </div>
          <div className="detail-item" title="Wind speed">
            <span className="detail-icon">💨</span><div className="detail-info">
              <span className="detail-label">Wind</span>
              <span className="detail-value">{weatherData.current.details.wind_speed} km/h</span>
            </div>
          </div>
          <div className="detail-item" title="Air moisture level">
            <span className="detail-icon">💧</span><div className="detail-info">
              <span className="label">Humidity</span>
              <span className="value">{weatherData.current.details.humidity}%</span>
            </div>
          </div>
        </div>
        <div className="weekly-forecast">
          <h3 className="section-title">7-Day Forecast</h3>
          <div className="week-days">
            {weatherData.weekly.map((day, index) => (
              <div key={index} className={`day-item ${day.active ? "active" : ""}`} title={`${day.day}: ${day.temp}°C`}>
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
              <div key={index} className={`hourly-item ${hour.active ? "active" : ""}`} title={`${hour.time === "NOW" ? "Current time" : hour.time + ":00"}: ${hour.temp}°C`}>
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
