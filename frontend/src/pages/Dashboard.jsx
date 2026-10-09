import React, { useState, useEffect, useRef } from 'react'
import { condominiumAPI } from '../services/api'
import QRScanner from '../components/QRScanner'
import EventList from '../components/EventList'
import EntryForm from '../components/EntryForm'

export default function Dashboard() {
  const [condominiumId] = useState('bed6c8c8-2e2c-48a0-9acd-a7b7b9f31e79') // Cambiar según necesites
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [message, setMessage] = useState('')
  const refreshIntervalRef = useRef(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [dashRes, eventsRes, visitsRes] = await Promise.all([
        condominiumAPI.getDashboard(condominiumId),
        condominiumAPI.getAccessEvents(condominiumId),
        condominiumAPI.getVisits(condominiumId),
      ])

      setDashboard(dashRes.data)
      setEvents(eventsRes.data)
      setVisits(visitsRes.data)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Refrescar cada 30 segundos
    refreshIntervalRef.current = setInterval(loadData, 30000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [condominiumId])

  const handleQRScanned = async (qrToken) => {
    try {
      setMessage('Validando QR...')
      const response = await condominiumAPI.validateQR(qrToken)

      if (response.data.valid) {
        const visit = visits.find((v) => v.id === response.data.visit_id)
        setSelectedVisit({
          ...visit,
          qrToken,
        })
        setShowQRScanner(false)
        setMessage('')
      } else {
        setMessage(`Error: ${response.data.message}`)
      }
    } catch (err) {
      setMessage('Error validando QR')
    }
  }

  const handleEntryRegistered = async () => {
    setSelectedVisit(null)
    setShowEntryForm(false)
    setMessage('Entrada registrada ✓')
    setTimeout(() => setMessage(''), 3000)
    await loadData()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard de Portería
            </h1>
            <p className="text-gray-600 text-sm">
              {localStorage.getItem('userEmail')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          {message}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">
              VISITAS ACTIVAS
            </div>
            <div className="text-4xl font-bold text-blue-600 mt-2">
              {dashboard?.active_visits || 0}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-semibold">
              ENTRADAS HOY
            </div>
            <div className="text-4xl font-bold text-green-600 mt-2">
              {dashboard?.entries_today || 0}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Escanear QR
          </button>

          <button
            onClick={() => setShowEntryForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Manual
          </button>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            onScanned={handleQRScanned}
          />
        )}

        {/* Entry Form Modal */}
        {showEntryForm && (
          <EntryForm
            condominiumId={condominiumId}
            onClose={() => setShowEntryForm(false)}
            onSuccess={handleEntryRegistered}
            visits={visits}
          />
        )}

        {/* Selected Visit Card */}
        {selectedVisit && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Visita Detectada
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600 text-sm">Visitante</p>
                <p className="text-lg font-semibold">{selectedVisit.visitor_alias}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Placa</p>
                <p className="text-lg font-semibold">{selectedVisit.license_plate}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Unidad</p>
                <p className="text-lg font-semibold">{selectedVisit.unit_id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Usos Disponibles</p>
                <p className="text-lg font-semibold">
                  {selectedVisit.max_uses - selectedVisit.uses_count}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={async () => {
                  try {
                    await condominiumAPI.registerEntry(
                      condominiumId,
                      selectedVisit.id,
                      selectedVisit.license_plate
                    )
                    setMessage('Entrada registrada ✓')
                    setSelectedVisit(null)
                    setTimeout(() => setMessage(''), 3000)
                    await loadData()
                  } catch (err) {
                    setMessage('Error registrando entrada')
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Registrar Entrada
              </button>
              <button
                onClick={() => setSelectedVisit(null)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        <EventList events={events} />
      </div>
    </div>
  )
}
