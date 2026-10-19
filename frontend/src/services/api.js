import axios from 'axios'

// Usa el mismo host desde el que se abrió el frontend (IP del servidor),
// en lugar de "localhost", que desde tu PC apuntaría a tu propio equipo.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`

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
  getCondominiums: () => api.get('/condominiums'),
  createCondominium: (name, address, timezone) =>
    api.post('/condominiums', { name, address, timezone }),
  createUnit: (condominiumId, code, block) =>
    api.post(`/condominiums/${condominiumId}/units`, { code, block }),
  assignRole: (condominiumId, userEmail, role, unitId) =>
    api.post(`/condominiums/${condominiumId}/roles/assign`, {
      user_email: userEmail,
      role,
      unit_id: unitId || null,
    }),
  getUnits: (condominiumId) => api.get(`/condominiums/${condominiumId}/units`),
  getVisits: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/visits`),
  getAccessEvents: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/access-events`),
  getDashboard: (condominiumId) =>
    api.get(`/condominiums/${condominiumId}/dashboard`),
  createVisit: (condominiumId, payload) =>
    api.post(`/condominiums/${condominiumId}/visits`, payload),
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
  registerWalkIn: (condominiumId, payload) =>
    api.post(`/condominiums/${condominiumId}/walk-in-entry`, payload),
}

export default api
