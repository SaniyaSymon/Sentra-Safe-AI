import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({ baseURL: API, timeout: 15000 });

export const api = {
  listShelters: (params) => apiClient.get('/shelters', { params }).then(r => r.data),
  listHospitals: (params) => apiClient.get('/hospitals', { params }).then(r => r.data),
  listColleges: (params) => apiClient.get('/colleges', { params }).then(r => r.data),
  listHazards: (params) => apiClient.get('/hazards', { params }).then(r => r.data),
  listCampusContacts: (params) => apiClient.get('/campus-contacts', { params }).then(r => r.data),
  createSOS: (payload) => apiClient.post('/sos', payload).then(r => r.data),
  listSOS: (params) => apiClient.get('/sos', { params }).then(r => r.data),
  getSOS: (id) => apiClient.get(`/sos/${id}`).then(r => r.data),
  updateSOS: (id, payload) => apiClient.patch(`/sos/${id}`, payload).then(r => r.data),
  listNotifications: (params) => apiClient.get('/notifications', { params }).then(r => r.data),
  testDispatch: (payload) => apiClient.post('/dispatch/test', payload).then(r => r.data),
  stats: (params) => apiClient.get('/stats', { params }).then(r => r.data),
  health: () => apiClient.get('/health').then(r => r.data),
};
