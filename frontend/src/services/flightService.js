import api from './api';

export const flightService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/flights/?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/flights/${id}/`);
    return response.data;
  },

  create: async (flightData) => {
    const response = await api.post('/flights/', flightData);
    return response.data;
  },

  update: async (id, flightData) => {
    const response = await api.put(`/flights/${id}/`, flightData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/flights/${id}/`);
    return response.data;
  }
};