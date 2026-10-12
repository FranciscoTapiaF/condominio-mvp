import React, { useEffect, useState } from 'react'
import { authAPI, condominiumAPI } from '../services/api'
import { unitLabel } from '../utils/format'

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
  const [isError, setIsError] = useState(false)

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
      setIsError(true)
      setMessage(errorText(err, 'No se pudieron cargar las unidades'))
    }
  }

  useEffect(() => {
    loadCondominiums()
      .catch(() => {
        setIsError(true)
        setMessage('No se pudieron cargar los condominios')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadUnits(selectedId)
  }, [selectedId])

  const run = async (action, okMessage, failMessage) => {
    setBusy(true)
    setMessage('')
    setIsError(false)
    try {
      await action()
      setMessage(okMessage)
    } catch (err) {
      setIsError(true)
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
        await loadUnits(selectedId)
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
          <div
            className={`border-l-4 p-4 rounded ${
              isError
                ? 'bg-red-100 border-red-500 text-red-800'
                : 'bg-green-100 border-green-500 text-green-800'
            }`}
          >
            {isError ? '✕ ' : '✓ '}{message}
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
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Condominios creados ({condominiums.length})
            </h2>
            {condominiums.length === 0 ? (
              <p className="text-gray-500">Aún no hay condominios. Crea el primero con el formulario.</p>
            ) : (
              <ul className="divide-y">
                {condominiums.map((c) => (
                  <li key={c.id} className="py-2 flex justify-between items-center">
                    <span className={c.id === selectedId ? 'font-bold text-blue-700' : 'text-gray-800'}>
                      {c.name}
                    </span>
                    {c.id !== selectedId && (
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Seleccionar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Unidades y propietarios ({units.length})
            </h2>
            {noCondo ? (
              <p className="text-gray-500">Selecciona o crea un condominio para ver sus unidades.</p>
            ) : units.length === 0 ? (
              <p className="text-gray-500">Este condominio aún no tiene unidades.</p>
            ) : (
              <ul className="divide-y max-h-64 overflow-y-auto">
                {units.map((u) => (
                  <li key={u.id} className="py-2">
                    <p className="font-semibold text-gray-800">{unitLabel(u)}</p>
                    <p className="text-sm text-gray-600">
                      {u.owners?.length
                        ? u.owners.map((o) => `${o.name} (${o.email})`).join(', ')
                        : 'Sin propietario asignado'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
                  <option key={u.id} value={u.id}>{unitLabel(u)}</option>
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
