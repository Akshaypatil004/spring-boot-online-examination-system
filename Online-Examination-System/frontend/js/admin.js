(() => {
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.Auth.requireRole('ADMIN')) return;
    document.body.classList.remove('d-none');
  });
})();
