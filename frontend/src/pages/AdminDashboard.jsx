import React, { useEffect, useState } from 'react'
import { authAPI, condominiumAPI } from '../services/api'

const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg'
const labelClass = 'block text-sm font-semibold text-gray-700 mb-2'
const buttonClass =
  'w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400'

const errorText = (err, fallback) => {
  const detail = err.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState(null)
  const [condominiums, setCondominiums] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const [condoForm, setCondoForm] = useState({ name: '', address: '', timezone: 'America/Santiago' })
  const [unitForm, setUnitForm] = useState({ code: '', block: '' })
  const [ownerForm, setOwnerForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [assignForm, setAssignForm] = useState({ email: '', unit_id: '' })

  const loadCondominiums = async (preferredId) => {
    const [meRes, condosRes] = await Promise.all([authAPI.getMe(), condominiumAPI.getCondominiums()])
    const adminCondos = (condosRes.data || []).filter((c) => c.role === 'administrador')
    setProfile(meRes.data)
    setCondominiums(adminCondos)
    setSelectedId((current) => {
      const wanted = preferredId || current
      if (adminCondos.some((c) => c.id === wanted)) return wanted
      return adminCondos[0]?.id || ''
    })
  }

  const loadUnits = async (condominiumId) => {
    if (!condominiumId) {
      setUnits([])
      return
    }
    try {
      const res = await condominiumAPI.getUnits(condominiumId)
      setUnits(res.data || [])
    } catch (err) {
      setMessage(errorText(err, 'No se pudieron cargar las unidades'))
    }
  }

  useEffect(() => {
    loadCondominiums()
      .catch(() => setMessage('No se pudieron cargar los condominios'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUnits(selectedId)
  }, [selectedId])

  const run = async (action, okMessage, failMessage) => {
    setBusy(true)
    setMessage('')
    try {
      await action()
      setMessage(okMessage)
    } catch (err) {
      setMessage(errorText(err, failMessage))
    } finally {
      setBusy(false)
    }
  }

  const handleCreateCondo = (e) => {
    e.preventDefault()
    run(
      async () => {
        const res = await condominiumAPI.createCondominium(
          condoForm.name,
          condoForm.address,
          condoForm.timezone
        )
        setCondoForm({ name: '', address: '', timezone: 'America/Santiago' })
        await loadCondominiums(res.data.id)
      },
      'Condominio creado correctamente',
      'Error creando el condominio'
    )
  }

  const handleCreateUnit = (e) => {
    e.preventDefault()
    run(
      async () => {
        await condominiumAPI.createUnit(selectedId, unitForm.code, unitForm.block || null)
        setUnitForm({ code: '', block: '' })
        await loadUnits(selectedId)
      },
      'Unidad creada correctamente',
      'Error creando la unidad'
    )
  }

  const handleCreateOwner = (e) => {
    e.preventDefault()
    run(
      async () => {
        await authAPI.register(
          ownerForm.name,
          ownerForm.email,
          ownerForm.password,
          ownerForm.phone || null
        )
        setAssignForm((prev) => ({ ...prev, email: ownerForm.email }))
        setOwnerForm({ name: '', email: '', phone: '', password: '' })
      },
      'Propietario registrado. Ya puedes asignarlo a una unidad.',
      'Error registrando el propietario'
    )
  }

  const handleAssign = (e) => {
    e.preventDefault()
    run(
      async () => {
        await condominiumAPI.assignRole(selectedId, assignForm.email, 'propietario', assignForm.unit_id)
        setAssignForm({ email: '', unit_id: '' })
      },
      'Propietario asignado a la unidad',
      'Error asignando el propietario'
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRoles')
    localStorage.removeItem('userProfile')
    localStorage.removeItem('selectedRole')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando administrador...</p>
      </div>
    )
  }

  const noCondo = !selectedId

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Administrador</h1>
            <p className="text-gray-600 text-sm">{profile?.name || 'Administrador'}</p>
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Condominio seleccionado</h2>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg"
          >
            {condominiums.length === 0 && <option value="">Sin condominios</option>}
            {condominiums.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <form onSubmit={handleCreateCondo} className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Crear condominio</h2>
            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} required value={condoForm.name}
                onChange={(e) => setCondoForm({ ...condoForm, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Dirección</label>
              <input className={inputClass} required value={condoForm.address}
                onChange={(e) => setCondoForm({ ...condoForm, address: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Zona horaria</label>
              <input className={inputClass} required value={condoForm.timezone}
                onChange={(e) => setCondoForm({ ...condoForm, timezone: e.target.value })} />
            </div>
            <button type="submit" disabled={busy} className={buttonClass}>Crear condominio</button>
          </form>

          <form onSubmit={handleCreateUnit} className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Crear unidad</h2>
            <div>
              <label className={labelClass}>Código</label>
              <input className={inputClass} required value={unitForm.code}
                onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Bloque</label>
              <input className={inputClass} value={unitForm.block}
                onChange={(e) => setUnitForm({ ...unitForm, block: e.target.value })} />
            </div>
            <button type="submit" disabled={busy || noCondo} className={buttonClass}>Crear unidad</button>
            <div className="text-sm text-gray-600">
              Unidades: {units.length === 0 ? 'ninguna' : units.map((u) => u.code).join(', ')}
            </div>
          </form>

          <form onSubmit={handleCreateOwner} className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Registrar propietario</h2>
            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} required value={ownerForm.name}
                onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} required value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input className={inputClass} value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Contraseña temporal</label>
              <input type="password" className={inputClass} required value={ownerForm.password}
                onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })} />
            </div>
            <button type="submit" disabled={busy} className={buttonClass}>Registrar propietario</button>
          </form>

          <form onSubmit={handleAssign} className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Asignar propietario a unidad</h2>
            <div>
              <label className={labelClass}>Email del propietario</label>
              <input type="email" className={inputClass} required value={assignForm.email}
                onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Unidad</label>
              <select className={inputClass} required value={assignForm.unit_id}
                onChange={(e) => setAssignForm({ ...assignForm, unit_id: e.target.value })}>
                <option value="">Selecciona unidad</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.code}{u.block ? ` - ${u.block}` : ''}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={busy || noCondo} className={buttonClass}>Asignar propietario</button>
          </form>
        </div>
      </div>
    </div>
  )
}
