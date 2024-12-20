const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather .details");
const weatherCardsDiv = document.querySelector(".weather-cards");
const dropdownMenu = document.querySelector(".recent-cities-dropdown");
const errorDiv = document.querySelector(".error-message");

const API_KEY = "ef1fc9bd22aa12d86066b4ca971d5014"; // Replace with your OpenWeatherMap API key

let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

// Update Current Weather
const updateCurrentWeather = (data) => {
    const today = new Date(data.dt * 1000).toLocaleDateString(); // Convert timestamp to readable date
    currentWeatherDiv.innerHTML = `
        <h2>${data.name} (${today})</h2>
        <h4>Temperature: ${(data.main.temp - 273.15).toFixed(1)}°C</h4>
        <h4>Wind: ${data.wind.speed} KPH</h4>
        <h4>Humidity: ${data.main.humidity}%</h4>
    `;
    const iconDiv = document.querySelector(".current-weather .icon");
    iconDiv.innerHTML = `
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">
        <h4>${data.weather[0].description}</h4>
    `;
};

// Update 5-Day Forecast
const updateForecast = (data) => {
    // Get unique dates for the next 5 days
    const today = new Date().toLocaleDateString(); // Get today's date
    const uniqueDates = []; // To track the next 5 days
    const forecastDays = data.list.filter((item) => {
        const forecastDate = new Date(item.dt * 1000).toLocaleDateString();
        if (!uniqueDates.includes(forecastDate) && forecastDate !== today) {
            uniqueDates.push(forecastDate); // Add new date if it's not already included
            return true; // Keep this item
        }
        return false; // Exclude duplicates or today's data
    });

    // Limit to the next 5 days
    const next5Days = forecastDays.slice(0, 5);

    weatherCardsDiv.innerHTML = ""; // Clear previous forecast cards

    next5Days.forEach((day) => {
        const date = new Date(day.dt * 1000).toLocaleDateString(); // Convert timestamp to readable date
        const cardHTML = `
            <li class="card bg-white p-4 rounded shadow">
                <h3>${date}</h3>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather Icon">
                <h4>Temperature: ${(day.main.temp - 273.15).toFixed(1)}°C</h4>
                <h4>Wind: ${day.wind.speed} KPH</h4>
                <h4>Humidity: ${day.main.humidity}%</h4>
            </li>`;
        weatherCardsDiv.insertAdjacentHTML("beforeend", cardHTML); // Add each day's forecast card to the div
    });
};

// Fetch Weather Data
const fetchWeather = async (url, city = null) => {
    try {
        errorDiv.classList.add("hidden"); // Hide error message
        currentWeatherDiv.innerHTML = ""; // Clear previous data
        weatherCardsDiv.innerHTML = "";

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        if (url.includes("forecast")) {
            updateForecast(data); // Update forecast for 5 days
        } else {
            updateCurrentWeather(data); // Update current weather
        }

        if (city && !recentCities.includes(city)) {
            recentCities.push(city);
            localStorage.setItem("recentCities", JSON.stringify(recentCities));
            updateDropdown();
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
        errorDiv.textContent = "Could not fetch weather data. Please try again later.";
        errorDiv.classList.remove("hidden");
    }
};

// Update Dropdown Menu
const updateDropdown = () => {
    dropdownMenu.innerHTML = `<option value="">Select a recent city</option>`;
    recentCities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        dropdownMenu.appendChild(option);
    });
};

// Event Listeners
dropdownMenu.addEventListener("change", () => {
    const selectedCity = dropdownMenu.value;
    if (!selectedCity) return;

    // Fetch both current weather and forecast data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity}&appid=${API_KEY}`;
    fetchWeather(weatherUrl, selectedCity);
    fetchWeather(forecastUrl);
});

searchButton.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
        alert("Please enter a city name.");
        return;
    }

    // Fetch both current weather and forecast data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}`;
    fetchWeather(weatherUrl, city);
    fetchWeather(forecastUrl);
    cityInput.value = ""; // Clear input field
});

locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Fetch both current weather and forecast data
                const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
                const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
                fetchWeather(weatherUrl);
                fetchWeather(forecastUrl);
            },
            () => {
                errorDiv.textContent = "Error getting location. Please check your browser settings.";
                errorDiv.classList.remove("hidden");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});

// Initialize Dropdown
updateDropdown();
