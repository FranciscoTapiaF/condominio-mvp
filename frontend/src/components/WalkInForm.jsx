import React, { useEffect, useState } from 'react'
import { condominiumAPI } from '../services/api'

const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function WalkInForm({ condominiumId, onClose, onSuccess }) {
  const [units, setUnits] = useState([])
  const [name, setName] = useState('')
  const [unitId, setUnitId] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [enteredAt, setEnteredAt] = useState(nowLocal())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    condominiumAPI
      .getUnits(condominiumId)
      .then((res) => setUnits(res.data || []))
      .catch(() => setError('No se pudieron cargar las unidades'))
  }, [condominiumId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await condominiumAPI.registerWalkIn(condominiumId, {
        visitor_alias: name,
        unit_id: unitId,
        license_plate: licensePlate || null,
        entered_at: new Date(enteredAt).toISOString(),
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error registrando el ingreso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Ingreso sin registro previo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nombre del visitante</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Unidad a visitar</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">-- Selecciona una unidad --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}{u.block ? ` (Bloque ${u.block})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Placa (opcional)</label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="ABCD12"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Hora de ingreso</label>
            <input
              type="datetime-local"
              value={enteredAt}
              onChange={(e) => setEnteredAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Registrar ingreso'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

