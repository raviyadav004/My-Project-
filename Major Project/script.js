const API_KEY = '4f81cc1d15de45d785082423252302';
let tempChartInstance = null;
let humidityChartInstance = null;

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled-nav');
    } else {
        navbar.classList.remove('scrolled-nav');
    }
});

async function getWeatherData(city) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=7&aqi=yes&alerts=yes`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data;
    } catch (error) {
        console.error('Error:', error);
        alert('Error fetching weather data: ' + error.message);
        throw error;
    }
}

function updateUI(data) {
    updateCurrentWeather(data);
    updateWeatherDetails(data);
    updateForecast(data.forecast.forecastday);
    updateCharts(data.forecast.forecastday);
}

function updateCurrentWeather(data) {
    const current = data.current;
    const location = data.location;

    document.getElementById('currentWeather').innerHTML = `
        <div class="current-header">
            <h2>${location.name}, ${location.country}</h2>
            <p>${new Date(current.last_updated_epoch * 1000).toLocaleString()}</p>
        </div>
        <div class="current-body">
            <img src="${current.condition.icon.replace('64x64', '128x128')}" class="weather-icon" alt="${current.condition.text}">
            <div class="current-temp">${current.temp_c}°C</div>
            <div class="current-condition">${current.condition.text}</div>
        </div>
    `;
}

function updateWeatherDetails(data) {
    const current = data.current;
    document.getElementById('weatherDetails').innerHTML = `
        <p>🌡️ Feels Like: ${current.feelslike_c}°C</p>
        <p>💧 Humidity: ${current.humidity}%</p>
        <p>🌬️ Wind: ${current.wind_kph} km/h</p>
        <p>☀️ UV Index: ${current.uv}</p>
        <p>🌫️ Visibility: ${current.vis_km} km</p>
        <p>🌡️ Pressure: ${current.pressure_mb} hPa</p>
    `;
}

function updateForecast(forecastDays) {
    const forecastContainer = document.getElementById('dailyForecast');
    forecastContainer.innerHTML = forecastDays.map((day, index) => `
        <div class="day-card" style="--i: ${index};">
            <h4>${new Date(day.date_epoch * 1000).toLocaleDateString('en-US', { weekday: 'long' })}</h4>
            <img src="${day.day.condition.icon}" alt="${day.day.condition.text}">
            <div class="temp-range">
                <span>↑ ${day.day.maxtemp_c}°C</span>
                <span>↓ ${day.day.mintemp_c}°C</span>
            </div>
            <p>${day.day.condition.text}</p>
            <div class="forecast-details">
                <span>💧 ${day.day.avghumidity}%</span>
                <span>🌬️ ${day.day.maxwind_kph} km/h</span>
            </div>
        </div>
    `).join('');

    // Trigger animations for the day cards
    const dayCards = document.querySelectorAll('.day-card');
    dayCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible'); // Add visible class for animation
        }, index * 100); // Stagger the animations
    });
}

function updateCharts(forecastDays) {
    const labels = forecastDays.map(day =>
        new Date(day.date_epoch * 1000).toLocaleDateString('en-US', { weekday: 'short' })
    );

    // Temperature Chart (Bar Chart)
    if (tempChartInstance) tempChartInstance.destroy();
    tempChartInstance = new Chart(document.getElementById('tempChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Max Temperature (°C)',
                data: forecastDays.map(day => day.day.maxtemp_c),
                backgroundColor: 'rgba(255, 107, 107, 0.6)',
                borderColor: '#ff6b6b',
                borderWidth: 1
            }, {
                label: 'Min Temperature (°C)',
                data: forecastDays.map(day => day.day.mintemp_c),
                backgroundColor: 'rgba(78, 205, 196, 0.6)',
                borderColor: '#4ecdc4',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '7-Day Temperature Forecast' }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Humidity Chart (Line Chart with Area Fill)
    if (humidityChartInstance) humidityChartInstance.destroy();
    humidityChartInstance = new Chart(document.getElementById('humidityChart'), {
        type: 'line',  // Changed to 'line'
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Humidity (%)',
                data: forecastDays.map(day => day.day.avghumidity),
                backgroundColor: 'rgba(78, 205, 196, 0.4)', // Area fill color
                borderColor: '#4ecdc4',
                borderWidth: 2,
                fill: true, // Fill the area under the line
                tension: 0.4 // Smooth the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '7-Day Humidity Forecast' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Humidity (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Days'
                    }
                }
            }
        }
    });

    // Show chart containers with animation
    document.getElementById('tempChartContainer').classList.add('visible');
    document.getElementById('humidityChartContainer').classList.add('visible');
}

// Initial load
window.onload = function () {
    document.getElementById('loading').style.display = 'flex';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error(error);
                getWeatherByCity('Delhi');
            }
        );
    } else {
        getWeatherByCity('Delhi');
    }
};

async function getWeatherByCity(city) {
    try {
        const data = await getWeatherData(city);
        updateUI(data);
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error(error);
        alert('Error fetching weather data');
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        const data = await getWeatherData(`${lat},${lon}`);
        updateUI(data);
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error(error);
        alert('Error fetching weather data');
    }
}

function searchWeather() {
    const city = document.getElementById('cityInput').value;
    if (city.trim() === '') return;

    document.getElementById('loading').style.display = 'flex';
    getWeatherByCity(city);
}

document.getElementById('cityInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') searchWeather();
});