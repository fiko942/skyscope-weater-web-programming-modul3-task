;(function ($) {
  'use strict';

  const ICON_BASE = 'assets/icons/';
  const TOAST_COLORS = {
    success: 'border-emerald-400 text-emerald-300',
    error: 'border-rose-400 text-rose-300',
    warning: 'border-amber-400 text-amber-300',
    info: 'border-cyan-400 text-cyan-200'
  };

  const WEATHER_MAP = [
    { codes: [0], label: 'Cerah', icon: 'weather-clear.svg' },
    { codes: [1, 2, 3], label: 'Sebagian Berawan', icon: 'weather-cloud.svg' },
    { codes: [45, 48], label: 'Berkabut', icon: 'weather-cloud.svg' },
    { codes: [51, 53, 55, 56, 57], label: 'Gerimis', icon: 'weather-rain.svg' },
    { codes: [61, 63, 65, 80, 81, 82], label: 'Hujan', icon: 'weather-rain.svg' },
    { codes: [66, 67], label: 'Hujan Beku', icon: 'weather-snow.svg' },
    { codes: [71, 73, 75, 77, 85, 86], label: 'Salju', icon: 'weather-snow.svg' },
    { codes: [95, 96, 99], label: 'Badai Petir', icon: 'weather-storm.svg' }
  ];

  const selectors = {};
  const TEN_MINUTES = 10 * 60 * 1000;

  const findByCode = (code) => {
    const entry = WEATHER_MAP.find((item) => item.codes.includes(code));
    return entry || { label: 'Cuaca Tidak Diketahui', icon: 'weather-cloud.svg' };
  };

  const formatTemp = (v) => `${Math.round(v)}°C`;
  const formatWind = (v) => `${Math.round(v)} km/jam`;
  const formatPct = (v) => `${Math.round(v)}%`;
  const formatDate = (iso, opts = {}) => {
    const date = new Date(iso);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', ...opts });
  };
  const formatHour = (iso) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Build a simple SVG path for the sparkline without pulling extra libraries.
  const sparklinePath = (values) => {
    if (!values.length) return '';
    const width = 600;
    const height = 120;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / Math.max(values.length - 1, 1);

    return values
      .map((value, index) => {
        const x = Math.round(index * step);
        const y = Math.round(height - ((value - min) / range) * (height - 10)) + 5;
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  };

  const cachedSelectors = () => {
    if (Object.keys(selectors).length) return selectors;

    selectors.currentSkeleton = $('#currentSkeleton');
    selectors.currentWeather = $('#currentWeather');
    selectors.dailySkeleton = $('#dailySkeleton');
    selectors.dailyForecast = $('#dailyForecast');
    selectors.hourlySkeleton = $('#hourlySkeleton');
    selectors.hourlyForecast = $('#hourlyForecast');
    selectors.hourlyList = $('#hourlyList');
    selectors.sparkline = $('#tempSparkline');
    selectors.toast = $('#toast > div');
    selectors.searchBtn = $('#searchBtn');
    selectors.cityInput = $('#cityInput');
    selectors.geoBtn = $('#geoBtn');

    return selectors;
  };

  const toggleSkeleton = (isLoading) => {
    const els = cachedSelectors();
    els.searchBtn.prop('disabled', isLoading);
    els.geoBtn.prop('disabled', isLoading);
    els.cityInput.prop('disabled', isLoading);
    els.currentWeather.toggleClass('hidden', isLoading);
    els.dailyForecast.toggleClass('hidden', isLoading);
    els.hourlyForecast.toggleClass('hidden', isLoading);

    els.currentSkeleton.toggleClass('hidden', !isLoading);
    els.dailySkeleton.toggleClass('hidden', !isLoading);
    els.hourlySkeleton.toggleClass('hidden', !isLoading);
  };

  const renderCurrent = ({ current, humidity, precipitationChance, cityLabel }) => {
    const els = cachedSelectors();
    const meta = findByCode(current.weathercode);
    const localTime = new Date(current.time).toLocaleString('id-ID', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const html = `
      <div class="">
        <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div class="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-inner">
            <img src="${ICON_BASE + meta.icon}" alt="${meta.label}" class="h-20 w-20">
          </div>
          <div class="space-y-2">
            <p class="max-w-2xl text-sm font-medium leading-snug text-slate-400">${cityLabel}</p>
            <p class="text-5xl font-semibold text-slate-100 md:text-6xl">${formatTemp(current.temperature)}</p>
            <p class="text-lg font-medium text-cyan-300">${meta.label}</p>
          </div>
        </div>
        <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
            <dt class="flex items-center gap-2 text-sm text-slate-400">
              <img src="${ICON_BASE}weather-wind.svg" alt="" class="h-5 w-5" aria-hidden="true">
              Kecepatan Angin
            </dt>
            <dd class="mt-2 text-xl font-semibold text-slate-100">${formatWind(current.windspeed)}</dd>
          </div>
          <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
            <dt class="flex items-center gap-2 text-sm text-slate-400">
              <img src="${ICON_BASE}weather-humidity.svg" alt="" class="h-5 w-5" aria-hidden="true">
              Kelembapan
            </dt>
            <dd class="mt-2 text-xl font-semibold text-slate-100">${formatPct(humidity)}</dd>
          </div>
          <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
            <dt class="flex items-center gap-2 text-sm text-slate-400">
              <img src="${ICON_BASE}weather-rain.svg" alt="" class="h-5 w-5" aria-hidden="true">
              Peluang Hujan (±1 jam)
            </dt>
            <dd class="mt-2 text-xl font-semibold text-slate-100">${formatPct(precipitationChance)}</dd>
          </div>
          <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
            <dt class="flex items-center gap-2 text-sm text-slate-400">
              <img src="${ICON_BASE}weather-clear.svg" alt="" class="h-5 w-5" aria-hidden="true">
              Waktu Lokal
            </dt>
            <dd class="mt-2 text-xl font-semibold text-slate-100">${localTime}</dd>
          </div>
        </dl>
      </div>
    `;
    els.currentWeather.html(html);
  };

  const renderDaily = (daily) => {
    const els = cachedSelectors();
    const days = [];
    for (let i = 0; i < daily.time.length && i < 7; i += 1) {
      const codeInfo = findByCode(daily.weathercode[i]);
      days.push(`
        <article class="group rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:bg-slate-900/80 hover:shadow-lg focus-within:-translate-y-1 focus-within:border-cyan-300" tabindex="0">
          <header>
            <h3 class="text-sm font-medium uppercase tracking-wide text-slate-400">${formatDate(daily.time[i])}</h3>
          </header>
          <div class="mt-3 flex items-center justify-between gap-3">
            <img src="${ICON_BASE + codeInfo.icon}" alt="${codeInfo.label}" class="h-12 w-12 flex-shrink-0">
            <div class="text-right">
              <p class="text-lg font-semibold text-slate-100">${formatTemp(daily.temperature_2m_max[i])}</p>
              <p class="text-sm text-slate-400">Min ${formatTemp(daily.temperature_2m_min[i])}</p>
            </div>
          </div>
          <footer class="mt-4 flex items-center justify-between text-sm text-slate-400">
            <span>${codeInfo.label}</span>
            <span>Peluang ${formatPct(daily.precipitation_probability_max?.[i] ?? 0)}</span>
          </footer>
        </article>
      `);
    }
    els.dailyForecast.html(days.join(''));
  };

  const renderHourly = (hourly, startIndex) => {
    const els = cachedSelectors();
    const items = [];
    const temps = [];
    const limit = Math.min(hourly.time.length, startIndex + 12);

    for (let i = startIndex; i < limit; i += 1) {
      const codeInfo = findByCode(hourly.weathercode[i]);
      const temp = hourly.temperature_2m[i];
      temps.push(temp);
      items.push(`
        <li class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-400">${formatHour(hourly.time[i])}</p>
              <p class="mt-1 text-xl font-semibold text-slate-100">${formatTemp(temp)}</p>
            </div>
            <img src="${ICON_BASE + codeInfo.icon}" alt="${codeInfo.label}" class="h-10 w-10">
          </div>
          <p class="mt-3 text-sm text-slate-400">Peluang hujan ${formatPct(hourly.precipitation_probability[i] ?? 0)}</p>
        </li>
      `);
    }

    els.hourlyList.html(items.join(''));
    const path = sparklinePath(temps);
    els.sparkline.html(`
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    `);
  };

  const renderEmpty = (message) => {
    const els = cachedSelectors();
    const html = `
      <div class="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-slate-400">
        <p class="text-base font-medium">${message}</p>
      </div>
    `;
    els.currentWeather.html(html);
    els.currentWeather.removeClass('hidden');
    els.dailyForecast.html(`
      <div class="col-span-full rounded-2xl border-2 border-dashed border-slate-800/70 bg-slate-900/50 p-4 text-center text-sm text-slate-400">
        Tidak ada data harian untuk ditampilkan.
      </div>
    `);
    els.hourlyList.html(`
      <li class="rounded-2xl border-2 border-dashed border-slate-800/70 bg-slate-900/50 p-4 text-center text-sm text-slate-400">
        Tidak ada data jam-an untuk ditampilkan.
      </li>
    `);
    els.sparkline.empty();
    els.hourlyForecast.removeClass('hidden');
  };

  let toastTimeout;
  const showToast = (type, message) => {
    const els = cachedSelectors();
    const baseClasses = 'max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur bg-slate-900/95';
    const color = TOAST_COLORS[type] || TOAST_COLORS.info;
    els.toast.attr('class', `${baseClasses} ${color}`).text(message).hide().fadeIn(200);
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      els.toast.fadeOut(200);
    }, 3200);
  };

  const initInteractions = () => {
    const $menuBtn = $('#menuBtn');
    const $mobileNav = $('#mobileNav');
    $menuBtn.on('click', () => {
      const isOpen = $mobileNav.toggleClass('hidden').is(':visible');
      $menuBtn.attr('aria-expanded', isOpen);
    });

    $('a[href^="#"]').on('click', function (e) {
      const targetId = $(this).attr('href');
      if (targetId.length > 1) {
        const $target = $(targetId);
        if ($target.length) {
          e.preventDefault();
          $('html, body').animate({ scrollTop: $target.offset().top - 80 }, 400);
        }
      }
    });
  };

  $(initInteractions);

  window.UI = {
    toggleSkeleton,
    renderCurrent,
    renderDaily,
    renderHourly,
    renderEmpty,
    showToast,
    formatTemp,
    formatWind,
    formatPct,
    formatDate,
    TEN_MINUTES
  };
})(jQuery);
