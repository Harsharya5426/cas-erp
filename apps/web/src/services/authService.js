import { api, refreshSessionToken, setAccessToken } from './apiClient.js';

export const authService = {
  async login({ email, password, mfaCode }) {
    const data = await api.post('/auth/login', {
      email,
      password,
      ...(mfaCode ? { mfaCode } : {})
    });
    setAccessToken(data.accessToken);
    return data;
  },

  async restoreSession() {
    const refreshed = await refreshSessionToken();
    if (!refreshed) return null;
    const me = await api.get('/auth/me');
    return me;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async switchRole(roleKey) {
    const data = await api.post('/auth/switch-role', { roleKey });
    setAccessToken(data.accessToken);
    return api.get('/auth/me');
  },

  async updatePreferences(preferences) {
    return api.patch('/auth/me/preferences', preferences);
  },

  async requestPasswordReset(email) {
    return api.post('/auth/password/forgot', { email });
  },

  async confirmPasswordReset(token, newPassword) {
    return api.post('/auth/password/reset', { token, newPassword });
  }
};
