const apiKey = '';
const searchBtn = document.getElementById('searchBtn');
const mapBtn = document.getElementById('mapBtn');
const searchInput = document.getElementById('search');
const weatherInfo = document.getElementById('weatherInfo');
const forecastInfo = document.getElementById('forecastInfo');
const hourlyInfo = document.getElementById('hourlyInfo');
const mapModal = document.getElementById('mapModal');
const closeModal = document.querySelector('.close');
let map;
let initialWeather = [];
let initialStartDate = null;
let currentStartDate = null;
let city = '';
let forecastDataGlobal = null;

// Fetch weather data
async function getWeather(cityName = null, lat = null, lon = null) {
    let currentUrl, forecastUrl;
    if (cityName) {
      currentUrl = `https://your-vercel-app.vercel.app/api/weather?city=${encodeURIComponent(cityName)}`;
      forecastUrl = `https://your-vercel-app.vercel.app/api/forecast?city=${encodeURIComponent(cityName)}`;
    } else if (lat && lon) {
      currentUrl = `https://your-vercel-app.vercel.app/api/weather?lat=${lat}&lon=${lon}`;
      forecastUrl = `https://your-vercel-app.vercel.app/api/forecast?lat=${lat}&lon=${lon}`;
    }
  
    try {
      const currentResponse = await fetch(currentUrl);
      if (!currentResponse.ok) throw new Error(`Current weather fetch failed: ${currentResponse.statusText}`);
      const currentData = await currentResponse.json();
      if (currentData.cod && currentData.cod !== 200) throw new Error(currentData.message);
      city = currentData.name;
      initialStartDate = new Date();
      currentStartDate = initialStartDate;
      displayCurrentWeather(currentData, city, initialStartDate);
  
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) throw new Error(`Forecast fetch failed: ${forecastResponse.statusText}`);
      const forecastData = await forecastResponse.json();
      if (forecastData.cod && forecastData.cod !== "200") throw new Error(forecastData.message);
      forecastDataGlobal = forecastData;
      initialWeather = extractInitialWeather(forecastData);
      displayForecast(initialWeather, initialStartDate, currentStartDate);
      displayHourlyWeather(forecastData, initialStartDate);
    } catch (error) {
      console.error('Error:', error);
      weatherInfo.innerHTML = `Error fetching weather data: ${error.message}`;
    }
  }

// Extract initial 5-day weather
function extractInitialWeather(forecastData) {
    const dailyData = [];
    for (let i = 0; i < forecastData.list.length && dailyData.length < 5; i += 8) {
        dailyData.push(forecastData.list[i]);
    }
    return dailyData;
}

// Display current weather
function displayCurrentWeather(dayData, city, date) {
    const iconUrl = `http://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png`;
    weatherInfo.innerHTML = `
    <h3>${city} - ${date.toLocaleDateString()}</h3>
    <img src="${iconUrl}" alt="${dayData.weather[0].description}" class="weather-icon">
    <p>Temperature: ${dayData.main.temp}°C</p>
    <p>Condition: ${dayData.weather[0].description}</p>
    <p>Humidity: ${dayData.main.humidity}%</p>
    <p>Wind: ${dayData.wind.speed} m/s</p>`;
    const weatherMain = dayData.weather[0].main.toLowerCase();
    let gradient;
    document.body.classList.remove('rain-weather', 'thunderstorm-weather', 'clear-weather', 'clouds-weather', 'snow-weather', 'default-weather');
    switch (weatherMain) {
        case 'rain':
        case 'drizzle':
            gradient = 'linear-gradient(135deg, #A9A9A9, #4682B4)';
            document.body.classList.add('rain-weather');
            break;
        case 'clear':
            gradient = 'linear-gradient(135deg, #FFD700, #87CEEB)';
            document.body.classList.add('clear-weather');
            break;
        case 'clouds':
            gradient = 'linear-gradient(135deg, #D3D3D3, #87CEEB)';
            document.body.classList.add('clouds-weather');
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #E6E6FA, #B0E0E6)';
            document.body.classList.add('snow-weather');
            break;
        case 'thunderstorm':
            gradient = 'linear-gradient(135deg, #4B0082, #4682B4)';
            document.body.classList.add('thunderstorm-weather');
            break;
        default:
            gradient = 'linear-gradient(135deg, #87CEEB, #4682B4)';
            document.body.classList.add('default-weather');
    }
    document.body.style.background = gradient;
}

// Display 5-day forecast with cycling
function displayForecast(initialWeather, initialStartDate, currentStartDate) {
    forecastInfo.innerHTML = '';
    const offsetDays = Math.floor((currentStartDate - initialStartDate) / (1000 * 60 * 60 * 24));
    for (let j = 0; j < 5; j++) {
        const dayIndex = (offsetDays + j) % 5; // Cycle through 5 days
        const weather = initialWeather[dayIndex];
        const date = new Date(currentStartDate.getTime() + j * 24 * 60 * 60 * 1000);
        const iconUrl = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
        forecastInfo.innerHTML += `
            <div class="forecast-day" data-date="${date.toISOString()}">
                <p>${date.toLocaleDateString()}</p>
                <img src="${iconUrl}" alt="${weather.weather[0].description}" class="weather-icon">
                <p>Temp: ${weather.main.temp.toFixed(1)}°C</p>
                <p>${weather.weather[0].description}</p>
            </div>
        `;
    }
}

// Display hourly weather with cycling
function displayHourlyWeather(forecastData, targetDate) {
    hourlyInfo.innerHTML = '';
    const totalHours = forecastData.list.length; // Typically 40 (5 days × 8 intervals)
    const hoursPerDay = 8; // 3-hour intervals per day
    const offsetDays = Math.floor((targetDate - initialStartDate) / (1000 * 60 * 60 * 24));
    const startIndex = (offsetDays * hoursPerDay) % totalHours; // Starting point in the cycle

    // Show 8 hourly entries (one day’s worth) starting from the calculated index
    for (let i = 0; i < hoursPerDay; i++) {
        const hourIndex = (startIndex + i) % totalHours; // Cycle through all 40 entries
        const hour = forecastData.list[hourIndex];
        const baseTime = new Date(targetDate.getTime());
        const hourOffset = i * 3 * 60 * 60 * 1000; // Increment by 3 hours
        const hourDate = new Date(baseTime.getTime() + hourOffset);
        const iconUrl = `http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
        hourlyInfo.innerHTML += `
            <div class="hourly-item">
                <p>${hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <img src="${iconUrl}" alt="${hour.weather[0].description}">
                <p>${hour.main.temp.toFixed(1)}°C</p>
                <p>${hour.weather[0].description}</p>
            </div>`;
    }
}

// Click listener for forecast days
forecastInfo.addEventListener('click', (e) => {
    const forecastDay = e.target.closest('.forecast-day');
    if (forecastDay) {
        const dateStr = forecastDay.getAttribute('data-date');
        currentStartDate = new Date(dateStr);
        const offsetDays = Math.floor((currentStartDate - initialStartDate) / (1000 * 60 * 60 * 24));
        const dayIndex = offsetDays % 5; // Cycle within 5 days
        const dayData = initialWeather[dayIndex];
        displayCurrentWeather(dayData, city, currentStartDate);
        displayForecast(initialWeather, initialStartDate, currentStartDate);
        displayHourlyWeather(forecastDataGlobal, currentStartDate);
    }
});

// Initialize map
function initMap(lat = 51.505, lon = -0.09) {
    map = L.map('map').setView([lat, lon], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        await getWeather(null, lat, lng);
        mapModal.style.display = 'none';
    });
}

// Event listeners for search and map functionality
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

mapBtn.addEventListener('click', () => {
    mapModal.style.display = 'block';
    if (!map) initMap();
});

closeModal.addEventListener('click', () => mapModal.style.display = 'none');

// Get user's location on load
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await getWeather(null, latitude, longitude);
    }, (error) => {
        console.error('Geolocation error:', error);
        weatherInfo.innerHTML = 'Could not get your location. Please search for a city.';
    });
}