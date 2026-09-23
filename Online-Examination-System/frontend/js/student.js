(() => {
  const page = document.querySelector('[data-student-view]');
  if (!page) return;

  const loading = page.querySelector('[data-student-loading]');
  const errorPanel = page.querySelector('[data-student-error]');
  const errorMessage = page.querySelector('[data-student-error-message]');
  const content = page.querySelector('[data-student-content]');
  const retryButton = page.querySelector('[data-student-retry]');

  function setLoading(isLoading) {
    loading.classList.toggle('d-none', !isLoading);
    if (isLoading) {
      errorPanel.classList.add('d-none');
      content.classList.add('d-none');
    }
  }

  function displayProfile(profile) {
    page.querySelectorAll('[data-field]').forEach((element) => {
      const property = element.dataset.field;
      const value = profile[property];
      const displayValue = value === null || value === undefined || value === '' ? 'Not provided' : String(value);
      element.textContent = `${displayValue}${value !== null && value !== undefined && value !== '' ? (element.dataset.suffix || '') : ''}`;
    });
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await window.Api.get('/api/students/me');
      if (response?.success !== true || !response.data || typeof response.data !== 'object') {
        throw new Error('The server returned an incomplete student profile. Please try again.');
      }
      displayProfile(response.data);
      loading.classList.add('d-none');
      errorPanel.classList.add('d-none');
      content.classList.remove('d-none');
    } catch (error) {
      if (error instanceof window.Api.ApiError && error.status === 401) return;
      errorMessage.textContent = error instanceof window.Api.ApiError && error.status === 404
        ? 'We could not find a student profile for this account.'
        : error.message || 'Unable to load your profile. Please try again.';
      loading.classList.add('d-none');
      content.classList.add('d-none');
      errorPanel.classList.remove('d-none');
    }
  }

  retryButton.addEventListener('click', loadProfile);
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Auth.requireRole('STUDENT')) loadProfile();
  });
})();
