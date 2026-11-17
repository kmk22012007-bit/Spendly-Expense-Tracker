/**
 * Spendly Centralized API Client Module
 * Satisfies NFR-16: All API calls go through one frontend API client module.
 * UI components do not call fetch directly.
 * Satisfies NFR-05: Data is only transmitted to this application's own backend.
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return null;
    }

    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (responseData && (responseData.detail || responseData.error)) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, responseData);
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or server unreachable error (NFR-08)
    throw new ApiError(
      'Backend service is unreachable. Please ensure the server is running.',
      0,
      { error: err.message }
    );
  }
}

export const apiClient = {
  // Transactions CRUD (FR-09 to FR-15)
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.type && params.type !== 'all') query.set('type', params.type);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.ordering) query.set('ordering', params.ordering);

    const queryString = query.toString();
    const endpoint = `/transactions/${queryString ? `?${queryString}` : ''}`;
    return request(endpoint, { method: 'GET' });
  },

  async getTransaction(id) {
    return request(`/transactions/${id}/`, { method: 'GET' });
  },

  async createTransaction(transactionData) {
    return request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  async updateTransaction(id, transactionData) {
    return request(`/transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  },

  async deleteTransaction(id) {
    return request(`/transactions/${id}/`, {
      method: 'DELETE',
    });
  },

  // Dashboard Aggregates (FR-01 to FR-07)
  async getDashboard(month = null) {
    const endpoint = month ? `/dashboard/?month=${month}` : '/dashboard/';
    return request(endpoint, { method: 'GET' });
  },

  // Analytics Aggregates (FR-24 to FR-28)
  async getAnalytics(params = {}) {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const queryString = query.toString();
    const endpoint = `/analytics/${queryString ? `?${queryString}` : ''}`;
    return request(endpoint, { method: 'GET' });
  },

  // Settings & Preferences (FR-29, FR-30, FR-31)
  async getSettings() {
    return request('/settings/', { method: 'GET' });
  },

  async updateSettings(settingsData) {
    return request('/settings/', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  async resetAllData() {
    return request('/settings/reset/', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  },
};
