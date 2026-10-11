import React, { useEffect, useMemo, useState } from 'react'
import { condominiumAPI } from '../services/api'

export default function OwnerDashboard() {
  const [userProfile, setUserProfile] = useState(null)
  const [condominiums, setCondominiums] = useState([])
  const [selectedCondominiumId, setSelectedCondominiumId] = useState('')
  const [units, setUnits] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    unit_id: '',
    visitor_alias: '',
    license_plate: '',
    valid_from: '',
    valid_until: '',
    max_uses: 1,
    notes: '',
  })

  const selectedCondominium = useMemo(
    () => condominiums.find((item) => item.id === selectedCondominiumId) || null,
    [condominiums, selectedCondominiumId]
  )

  const loadProfile = async () => {
    try {
      const profileRes = await fetch('/api/me')
      const profileData = await profileRes.json()
      setUserProfile(profileData)
    } catch (err) {
      console.error('Error cargando perfil', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, condominiumsRes] = await Promise.all([
          fetch('/api/me'),
          condominiumAPI.getCondominiums(),
        ])

        const profileData = await profileRes.json()
        const ownerCondominiums = (condominiumsRes.data || []).filter(
          (item) => item.role === 'propietario'
        )

        setUserProfile(profileData)
        setCondominiums(ownerCondominiums)

        if (ownerCondominiums.length > 0) {
          const firstId = ownerCondominiums[0].id
          setSelectedCondominiumId(firstId)
          localStorage.setItem('selectedCondominiumId', firstId)
        }
      } catch (err) {
        console.error('Error cargando datos del propietario', err)
        setMessage('No se pudieron cargar los condominios')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadUnitsAndVisits = async () => {
      if (!selectedCondominiumId) return

      try {
        const [unitsRes, visitsRes] = await Promise.all([
          condominiumAPI.getUnits(selectedCondominiumId),
          condominiumAPI.getVisits(selectedCondominiumId),
        ])

        setUnits(unitsRes.data || [])
        setVisits(visitsRes.data || [])
      } catch (err) {
        console.error('Error cargando unidades y visitas', err)
      }
    }

    loadUnitsAndVisits()
  }, [selectedCondominiumId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const payload = {
        condominium_id: selectedCondominiumId,
        unit_id: form.unit_id,
        visitor_alias: form.visitor_alias,
        license_plate: form.license_plate,
        valid_from: form.valid_from,
        valid_until: form.valid_until,
        max_uses: Number(form.max_uses || 1),
        notes: form.notes,
      }

      const response = await condominiumAPI.createVisit(selectedCondominiumId, payload)
      const newVisit = response.data

      setMessage(`Visita creada correctamente. QR: ${newVisit.qr_token}`)
      setForm({
        unit_id: '',
        visitor_alias: '',
        license_plate: '',
        valid_from: '',
        valid_until: '',
        max_uses: 1,
        notes: '',
      })

      const visitsRes = await condominiumAPI.getVisits(selectedCondominiumId)
      setVisits(visitsRes.data || [])
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Error creando la visita')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRoles')
    localStorage.removeItem('userProfile')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando propietario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Propietario</h1>
            <p className="text-gray-600 text-sm">{userProfile?.name || 'Propietario'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded">
            {message}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Selecciona condominio</h2>
          <select
            value={selectedCondominiumId}
            onChange={(e) => setSelectedCondominiumId(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg"
          >
            {condominiums.map((condo) => (
              <option key={condo.id} value={condo.id}>{condo.name}</option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Registrar visita</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad</label>
                <select
                  name="unit_id"
                  value={form.unit_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecciona unidad</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.code} {unit.block ? `- ${unit.block}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alias del visitante</label>
                <input
                  name="visitor_alias"
                  value={form.visitor_alias}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Carlos Vega"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Placa</label>
                <input
                  name="license_plate"
                  value={form.license_plate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="ABC-1234"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Válida desde</label>
                  <input
                    type="datetime-local"
                    name="valid_from"
                    value={form.valid_from}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Válida hasta</label>
                  <input
                    type="datetime-local"
                    name="valid_until"
                    value={form.valid_until}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Máximo de usos</label>
                <input
                  type="number"
                  name="max_uses"
                  min="1"
                  value={form.max_uses}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Información adicional"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-400"
              >
                {saving ? 'Guardando...' : 'Crear visita'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Mis visitas</h2>
            <div className="space-y-4">
              {visits.length === 0 ? (
                <p className="text-gray-500">Aún no hay visitas registradas.</p>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{visit.visitor_alias || 'Visita'}</p>
                        <p className="text-sm text-gray-500">{visit.license_plate || 'Sin placa'}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        {visit.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Unidad: {visit.unit_id}</p>
                    <p className="text-sm text-gray-600">Desde: {new Date(visit.valid_from).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Hasta: {new Date(visit.valid_until).toLocaleString()}</p>
                    <div className="mt-3 bg-gray-100 border border-gray-200 rounded-lg p-3 text-xs break-all text-gray-700">
                      QR: {visit.qr_token || 'Generado al crear'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Condominio activo</h2>
          <p className="text-gray-700">{selectedCondominium ? selectedCondominium.name : 'Sin condominio'}</p>
        </div>
      </div>
    </div>
  )
}
