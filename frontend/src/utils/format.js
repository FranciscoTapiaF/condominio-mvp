export const unitLabel = (item) => {
  if (!item) return '—'
  const code = item.unit_code ?? item.code
  const block = item.unit_block ?? item.block
  if (!code) return 'Unidad sin identificar'
  return block ? `${code} - ${block}` : code
}

export const visitStatus = (visit, now = new Date()) => {
  if (!visit) return { label: 'Desconocida', className: 'bg-gray-100 text-gray-700' }
  if (visit.status !== 'active') {
    return { label: 'Inactiva', className: 'bg-gray-100 text-gray-700' }
  }
  if (new Date(visit.valid_until) < now) {
    return { label: 'Vencida', className: 'bg-red-100 text-red-800' }
  }
  if (visit.uses_count >= visit.max_uses) {
    return { label: 'Agotada', className: 'bg-yellow-100 text-yellow-800' }
  }
  if (new Date(visit.valid_from) > now) {
    return { label: 'Programada', className: 'bg-blue-100 text-blue-800' }
  }
  return { label: 'Vigente', className: 'bg-green-100 text-green-800' }
}

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('es-CL') : '—'

const QR_ERRORS = {
  'Token inválido': 'QR inválido: no corresponde a ninguna visita registrada.',
  'Token revocado': 'QR revocado: el propietario canceló este acceso.',
  'Visita no activa': 'La visita no está activa.',
  'Visita fuera de vigencia': 'QR vencido o aún no vigente: está fuera de su ventana de validez.',
  'Visita agotada': 'QR agotado: ya se utilizaron todos los ingresos permitidos.',
  'Visita no encontrada': 'No se encontró la visita asociada al QR.',
}

export const qrErrorMessage = (detail) => QR_ERRORS[detail] || detail || 'No se pudo validar el QR'

const TOKENS_KEY = 'visitTokens'

export const saveVisitToken = (visitId, token) => {
  try {
    const all = JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}')
    all[visitId] = token
    localStorage.setItem(TOKENS_KEY, JSON.stringify(all))
  } catch {
    // almacenamiento no disponible
  }
}

export const getVisitToken = (visitId) => {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || '{}')[visitId] || null
  } catch {
    return null
  }
}
