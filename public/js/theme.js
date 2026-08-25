/**
 * Study Mate AI - Theme Controller
 * Supports Light Mode (Default Warm Slate) & Obsidian Slate Dark Mode (Strictly Non-Bluish AI Theme)
 */

(function () {
  const THEME_KEY = 'studymate_theme';

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Update theme toggle icons if present
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    });
  }

  // Apply saved theme immediately on load
  const currentTheme = getStoredTheme();
  applyTheme(currentTheme);

  // Expose global toggle function
  window.toggleTheme = function () {
    const active = document.documentElement.getAttribute('data-theme') || 'light';
    const next = active === 'light' ? 'dark' : 'light';
    applyTheme(next);
  };
})();
