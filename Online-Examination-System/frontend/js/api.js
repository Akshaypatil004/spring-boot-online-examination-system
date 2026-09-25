(() => {
  const API_BASE_URL = 'http://localhost:8080';

  class ApiError extends Error {
    constructor(status, message, payload, backendMessage = '') {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.payload = payload;
      this.backendMessage = backendMessage;
    }
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    const token = window.Auth?.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch {
      throw new ApiError(0, 'Unable to reach the server. Check that the backend is running and try again.');
    }

    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { payload = await response.json(); } catch { payload = null; }
    }
    if (!response.ok) {
      const backendMessage = typeof payload?.message === 'string' ? payload.message : '';
      const message = response.status === 400
        ? 'The request could not be accepted. Review the information and try again.'
        : response.status === 404
          ? 'The requested information could not be found.'
          : response.status === 409
            ? 'This request conflicts with the current data. Refresh and try again.'
            : response.status >= 500
              ? 'The server could not complete this request. Please try again later.'
              : 'The request could not be completed. Please try again.';
      if (response.status === 401 && token) window.Auth?.handleUnauthorized();
      if (response.status === 403 && token) window.Auth?.handleForbidden();
      throw new ApiError(response.status, message, payload, backendMessage);
    }
    return payload;
  }

  window.Api = {
    request,
    post(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); },
    put(path, body) { return request(path, { method: 'PUT', body: JSON.stringify(body) }); },
    get(path) { return request(path, { method: 'GET' }); },
    ApiError
  };
})();
