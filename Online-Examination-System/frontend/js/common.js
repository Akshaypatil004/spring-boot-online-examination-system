(() => {
  const themeKey = 'exam-portal-theme';
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const icon = document.querySelector('[data-theme-icon]');
  const label = document.querySelector('[data-theme-label]');

  function setTheme(theme) {
    const isDark = theme === 'dark';
    root.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    if (toggle) {
      toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
      toggle.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    }
    if (icon) {
      icon.classList.toggle('bi-moon-stars', !isDark);
      icon.classList.toggle('bi-sun', isDark);
    }
    if (label) label.textContent = isDark ? 'Light theme' : 'Dark theme';
  }

  let initialTheme = 'light';
  try {
    const savedTheme = window.localStorage.getItem(themeKey);
    if (savedTheme === 'light' || savedTheme === 'dark') initialTheme = savedTheme;
  } catch {
    // The default theme remains available when browser storage is disabled.
  }
  setTheme(initialTheme);

  toggle?.addEventListener('click', () => {
    const nextTheme = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(themeKey, nextTheme);
    } catch {
      // Theme switching still works for the current page when storage is disabled.
    }
  });

  const year = document.querySelector('[data-current-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
