(() => {
  const TOKEN_KEY = 'accessToken';
  const ROLE_KEY = 'role';
  const routes = { STUDENT: 'student/dashboard.html', ADMIN: 'admin/dashboard.html' };

  function getToken() { return window.sessionStorage.getItem(TOKEN_KEY); }
  function getRole() { return window.sessionStorage.getItem(ROLE_KEY); }
  function destinationForRole(role) { return routes[role] || null; }
  function clearSession() {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(ROLE_KEY);
  }
  function logout() {
    const destination = getRole() === 'ADMIN' ? '../login.html' : '../index.html';
    clearSession();
    window.location.replace(destination);
  }
  function requireRole(role) {
    if (!getToken()) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`../login.html?reason=session&returnTo=${encodeURIComponent(returnTo)}`);
      return false;
    }
    if (getRole() !== role) {
      const destination = destinationForRole(getRole());
      if (destination) window.location.replace(`../${destination}`);
      else window.location.replace('../login.html?reason=session');
      return false;
    }
    return true;
  }
  function handleUnauthorized() {
    clearSession();
    const isNested = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/');
    const prefix = isNested ? '../' : '';
    window.location.replace(`${prefix}login.html?reason=session`);
  }
  function handleForbidden() {
    clearSession();
    const message = 'You do not have permission to access that resource.';
    const isNested = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/');
    const prefix = isNested ? '../' : '';
    window.location.replace(`${prefix}login.html?reason=${encodeURIComponent(message)}`);
  }

  window.Auth = { getToken, getRole, clearSession, logout, requireRole, handleUnauthorized, handleForbidden, destinationForRole };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', logout));
    const form = document.querySelector('[data-login-form]');
    if (!form) return;

    const token = getToken();
    const existingDestination = destinationForRole(getRole());
    if (token && existingDestination) {
      window.location.replace(existingDestination);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const notice = document.querySelector('[data-auth-notice]');
    if (params.get('reason') === 'session' && notice) {
      notice.textContent = 'Your session has expired or is no longer valid. Please sign in again.';
      notice.classList.remove('d-none');
    } else if (params.has('reason') && notice) {
      notice.textContent = params.get('reason');
      notice.classList.remove('d-none');
    }

    const email = form.elements.email;
    const password = form.elements.password;
    const submit = form.querySelector('[data-login-submit]');
    const spinner = form.querySelector('[data-submit-spinner]');
    const errorBox = document.querySelector('[data-auth-error]');

    form.addEventListener('input', (event) => {
      if (event.target.matches('input')) event.target.classList.remove('is-invalid');
      errorBox.classList.add('d-none');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorBox.classList.add('d-none');
      email.value = email.value.trim();
      const emailValid = email.value !== '' && email.validity.valid;
      const passwordValid = password.value.trim() !== '';
      email.classList.toggle('is-invalid', !emailValid);
      password.classList.toggle('is-invalid', !passwordValid);
      if (!emailValid || !passwordValid) {
        (emailValid ? password : email).focus();
        return;
      }

      submit.disabled = true;
      spinner.classList.remove('d-none');
      try {
        const response = await window.Api.post('/api/auth/login', { email: email.value, password: password.value });
        const loginData = response?.data;
        const destination = window.Auth.destinationForRole(loginData?.role);
        if (response?.success !== true || !loginData?.accessToken || !destination) {
          throw new Error('The server returned an incomplete or unsupported sign-in response.');
        }
        window.sessionStorage.setItem(TOKEN_KEY, loginData.accessToken);
        window.sessionStorage.setItem(ROLE_KEY, loginData.role);
        window.location.replace(destination);
      } catch (error) {
        if (error instanceof window.Api.ApiError && error.status === 401) {
          errorBox.textContent = 'The email or password is incorrect. Check your details and try again.';
        } else if (error instanceof window.Api.ApiError && error.status === 403) {
          errorBox.textContent = 'Sign-in is not permitted for this account. Contact your administrator.';
        } else {
          errorBox.textContent = error.message || 'Unable to sign in. Please try again.';
        }
        errorBox.classList.remove('d-none');
      } finally {
        submit.disabled = false;
        spinner.classList.add('d-none');
      }
    });
  });
})();
