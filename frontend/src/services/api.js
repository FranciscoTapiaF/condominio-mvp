import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (name, email, password, phone) =>
    api.post('/auth/register', { name, email, password, phone }),
  getMe: () => api.get('/me'),
}

export const condominiumAPI = {
  getVisits: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/visits`),
  getAccessEvents: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/access-events`),
  getDashboard: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/dashboard`),
  registerEntry: (condominiumId, visitId, licensePlate) =>
    api.post('/access/entry', {
      condominium_id: condominiumId,
      visit_id: visitId,
      event_type: 'entry',
      license_plate_detected: licensePlate,
      source: 'qr',
    }),
  registerExit: (condominiumId, licensePlate) =>
    api.post('/access/exit', {
      condominium_id: condominiumId,
      event_type: 'exit',
      license_plate_detected: licensePlate,
      source: 'manual',
    }),
  validateQR: (token) =>
    api.post('/access/validate-qr', { token }),
}

export default api
