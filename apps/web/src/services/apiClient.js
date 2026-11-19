const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

let inMemoryAccessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  inMemoryAccessToken = token || null;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function refreshSessionToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    const body = await parseJsonSafe(res);
    if (!res.ok || !body?.success) {
      setAccessToken(null);
      return null;
    }
    setAccessToken(body.data.accessToken);
    return body.data;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    idempotencyKey,
    skipAuthRetry = false,
    isFormData = false
  } = options;

  const finalHeaders = { ...headers };
  if (!isFormData && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (inMemoryAccessToken) {
    finalHeaders.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  if (idempotencyKey) {
    finalHeaders['Idempotency-Key'] = idempotencyKey;
  }

  let response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    credentials: 'include',
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
  });

  if (response.status === 401 && !skipAuthRetry && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshed = await refreshSessionToken();
    if (refreshed?.accessToken) {
      finalHeaders.Authorization = `Bearer ${refreshed.accessToken}`;
      response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: finalHeaders,
        credentials: 'include',
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
      });
    }
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(
      payload?.error?.message || `Request failed (${response.status})`,
      response.status,
      payload?.error?.code || 'HTTP_ERROR',
      payload?.error?.details
    );
  }

  return payload?.data ?? payload;
}

export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body, opts = {}) => apiRequest(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => apiRequest(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts = {}) => apiRequest(path, { method: 'PATCH', body, ...opts }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
  upload: (path, formData) => apiRequest(path, { method: 'POST', body: formData, isFormData: true })
};

