import React, { useState } from 'react'
import { condominiumAPI } from '../services/api'

export default function EntryForm({ condominiumId, onClose, onSuccess, visits }) {
  const [licensePlate, setLicensePlate] = useState('')
  const [visitId, setVisitId] = useState('')
  const [eventType, setEventType] = useState('entry')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (eventType === 'entry' && visitId) {
        await condominiumAPI.registerEntry(
          condominiumId,
          visitId,
          licensePlate
        )
      } else if (eventType === 'exit') {
        await condominiumAPI.registerExit(condominiumId, licensePlate)
      }

      onSuccess()
    } catch (err) {
      setError(
        err.response?.data?.detail || `Error registrando ${eventType}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Registrar Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Tipo de Evento
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value)
                setVisitId('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
            </select>
          </div>

          {eventType === 'entry' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Seleccionar Visita
              </label>
              <select
                value={visitId}
                onChange={(e) => setVisitId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Selecciona una visita --</option>
                {visits
                  .filter((v) => v.status === 'active' && v.uses_count < v.max_uses)
                  .map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {visit.visitor_alias} - {visit.unit_id}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Placa Vehículo
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABCD12"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
