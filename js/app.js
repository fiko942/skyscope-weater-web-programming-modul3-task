;(function ($, UI) {
  'use strict';

  const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
  const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
  const NOMINATIM_HEADERS = {
    'Accept-Language': 'id-ID,en;q=0.8',
    'User-Agent': 'SkyScopeWeatherStudent/1.0 (+https://example.com)'
  };
  const STORAGE_KEYS = {
    LAST_CITY: 'lastCity'
  };

  const getCacheKey = (lat, lon) => `weather:${lat.toFixed(3)},${lon.toFixed(3)}`;

  const readCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('Gagal membaca cache', error);
      return null;
    }
  };

  const writeCache = (key, payload) => {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.warn('Gagal menulis cache', error);
    }
  };

  const geocodeCity = async (query) => {
    const url = `${NOMINATIM_ENDPOINT}/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      throw new Error('Gagal mengambil data lokasi. Coba lagi.');
    }
    const results = await response.json();
    if (!Array.isArray(results) || !results.length) {
      throw new Error('Kota tidak ditemukan. Coba nama kota lain.');
    }
    return results[0];
  };

  const reverseGeocode = async (lat, lon) => {
    const url = `${NOMINATIM_ENDPOINT}/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      throw new Error('Gagal mengenali lokasi Anda.');
    }
    const result = await response.json();
    return result?.display_name || `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
  };

  const fetchWeather = async (lat, lon) => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current_weather: 'true',
      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'relative_humidity_2m',
        'wind_speed_10m',
        'weathercode'
      ].join(','),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'weathercode'
      ].join(','),
      forecast_days: '7',
      timezone: 'auto'
    });
    const response = await fetch(`${WEATHER_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Gagal memuat data cuaca dari Open-Meteo.');
    }
    const data = await response.json();
    if (!data?.current_weather) {
      throw new Error('Data cuaca tidak lengkap.');
    }
    return data;
  };

  const pickHourlyIndex = (hourlyTimes, targetIso) => {
    const idx = hourlyTimes.indexOf(targetIso);
    if (idx !== -1) return idx;
    const target = new Date(targetIso).getTime();
    let closestIndex = 0;
    let smallestDiff = Infinity;
    hourlyTimes.forEach((iso, index) => {
      const diff = Math.abs(new Date(iso).getTime() - target);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  // Try network fetch first, but gracefully fall back to cached payloads within 10 minutes.
  const resolveWeatherData = async (lat, lon, cityLabel) => {
    const cacheKey = getCacheKey(lat, lon);
    const cached = readCache(cacheKey);
    const hasFreshCache = cached && Date.now() - cached.timestamp < UI.TEN_MINUTES;
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

    if (offline && hasFreshCache) {
      UI.showToast('warning', 'Anda offline, menampilkan data cache.');
      return { data: cached.data, label: cached.cityLabel || cityLabel, source: 'cache' };
    }

    try {
      const data = await fetchWeather(lat, lon);
      writeCache(cacheKey, {
        timestamp: Date.now(),
        data,
        cityLabel
      });
      return { data, label: cityLabel, source: 'network' };
    } catch (error) {
      if (hasFreshCache) {
        UI.showToast('warning', 'Menggunakan data terakhir yang tersimpan.');
        return { data: cached.data, label: cached.cityLabel || cityLabel, source: 'cache' };
      }
      throw error;
    }
  };

  const renderWeather = (weatherData, cityLabel) => {
    const { current_weather: current, hourly, daily } = weatherData;
    const index = pickHourlyIndex(hourly.time, current.time);
    const humidity = hourly.relative_humidity_2m?.[index] ?? 0;
    const rainChance = hourly.precipitation_probability?.[index] ?? 0;

    UI.renderCurrent({
      current,
      humidity,
      precipitationChance: rainChance,
      cityLabel
    });
    UI.renderDaily(daily);
    UI.renderHourly(hourly, index);
  };

  const handleError = (error) => {
    console.error(error);
    UI.renderEmpty('Tidak dapat memuat data cuaca. Silakan coba lagi.');
    UI.showToast('error', error.message || 'Terjadi kesalahan tak terduga.');
  };

  const updateLastCity = (query) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_CITY, query);
    } catch (error) {
      console.warn('Tidak dapat menyimpan kota terakhir', error);
    }
  };

  const loadLastCity = () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    } catch (error) {
      console.warn('Tidak dapat membaca kota terakhir', error);
      return null;
    }
  };

  const performSearch = async (query) => {
    UI.toggleSkeleton(true);
    try {
      const geo = await geocodeCity(query.trim());
      const lat = Number(geo.lat);
      const lon = Number(geo.lon);
      const displayName = geo.display_name;
      const { data, label, source } = await resolveWeatherData(lat, lon, displayName);
      renderWeather(data, label);
      UI.toggleSkeleton(false);
      UI.showToast('success', `Cuaca untuk ${label} berhasil dimuat${source === 'cache' ? ' (cache)' : ''}.`);
      updateLastCity(query.trim());
    } catch (error) {
      UI.toggleSkeleton(false);
      handleError(error);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      UI.showToast('error', 'Peramban tidak mendukung geolokasi.');
      return;
    }

    UI.toggleSkeleton(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const cityLabel = await reverseGeocode(latitude, longitude);
          const { data, label, source } = await resolveWeatherData(latitude, longitude, cityLabel);
          renderWeather(data, label);
          UI.toggleSkeleton(false);
          UI.showToast('success', `Cuaca untuk lokasi Anda dimuat${source === 'cache' ? ' (cache)' : ''}.`);
          updateLastCity(cityLabel);
        } catch (error) {
          UI.toggleSkeleton(false);
          handleError(error);
        }
      },
      (error) => {
        UI.toggleSkeleton(false);
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Izin geolokasi ditolak.'
            : 'Tidak dapat mendapatkan lokasi Anda.';
        UI.showToast('error', message);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  };

  $(function () {
    const $form = $('#searchForm');
    const $input = $('#cityInput');
    const $geoBtn = $('#geoBtn');

    $form.on('submit', (event) => {
      event.preventDefault();
      const value = $input.val();
      if (!value) {
        UI.showToast('warning', 'Masukkan nama kota terlebih dahulu.');
        return;
      }
      performSearch(value);
    });

    $geoBtn.on('click', handleGeolocation);

    const lastCity = loadLastCity();
    if (lastCity) {
      $input.val(lastCity);
      performSearch(lastCity);
    } else {
      UI.toggleSkeleton(false);
      UI.renderEmpty('Mulai dengan mencari kota favorit Anda.');
      if (navigator.geolocation) {
        UI.showToast('info', 'Tips: gunakan tombol lokasi untuk prakiraan sekitar Anda.');
      }
    }
  });
})(jQuery, window.UI);
