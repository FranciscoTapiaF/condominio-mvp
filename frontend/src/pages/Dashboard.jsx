import React, { useState, useEffect, useRef } from 'react'
import { condominiumAPI } from '../services/api'
import QRScanner from '../components/QRScanner'
import EventList from '../components/EventList'
import EntryForm from '../components/EntryForm'
import { formatDateTime, qrErrorMessage, unitLabel, visitStatus } from '../utils/format'
import WalkInForm from '../components/WalkInForm'

export default function Dashboard() {
  const [condominiums, setCondominiums] = useState([])
  const [condominiumId, setCondominiumId] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [message, setMessage] = useState('')
  const [messageIsError, setMessageIsError] = useState(false)
  const [search, setSearch] = useState('')
  const refreshIntervalRef = useRef(null)
  const [showWalkIn, setShowWalkIn] = useState(false)



  const loadData = async (silent = false) => {
    if (!condominiumId) return
    try {
      if (!silent) setLoading(true)
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
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const loadCondominiums = async () => {
      try {
        const res = await condominiumAPI.getCondominiums()
        const list = res.data || []
        setCondominiums(list)
        const stored = localStorage.getItem('selectedCondominiumId')
        const active = list.find((c) => c.id === stored) || list[0]
        if (active) {
          localStorage.setItem('selectedCondominiumId', active.id)
          setCondominiumId(active.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error cargando condominios:', err)
        setLoading(false)
      }
    }
    loadCondominiums()
  }, [])



  useEffect(() => {
    if (!condominiumId) return
    loadData()

    refreshIntervalRef.current = setInterval(() => {
      if (showEntryForm || showQRScanner || selectedVisit || showWalkIn) return
      loadData(true)
    }, 30000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [condominiumId, showEntryForm, showQRScanner, selectedVisit, showWalkIn])




  const handleQRScanned = async (qrToken) => {
    try {
      setMessageIsError(false)
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
        setMessageIsError(true)
        setMessage(qrErrorMessage(response.data.message))
      }
    } catch (err) {
      setMessageIsError(true)
      setMessage('Error validando QR')
    }
  }

const handleWalkInRegistered = async () => {
  setShowWalkIn(false)
  setMessageIsError(false)
  setMessage('Ingreso registrado ✓')
  setTimeout(() => setMessage(''), 3000)
  await loadData()
}

  const term = search.trim().toLowerCase()
  const filteredVisits = term
    ? visits.filter(
        (v) =>
          (v.license_plate || '').toLowerCase().includes(term.replace(/[^a-z0-9]/g, '')) ||
          (v.license_plate || '').toLowerCase().includes(term) ||
          (v.visitor_alias || '').toLowerCase().includes(term)
      )
    : []
  const filteredEvents = term
    ? events.filter(
        (e) =>
          (e.license_plate_detected || '').toLowerCase().includes(term.replace(/[^a-z0-9]/g, '')) ||
          (e.visitor_alias || '').toLowerCase().includes(term)
      )
    : events

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

      {condominiums.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <select
            value={condominiumId}
            onChange={(e) => {
              localStorage.setItem('selectedCondominiumId', e.target.value)
              setCondominiumId(e.target.value)
            }}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg"
          >
            {condominiums.map((condo) => (
              <option key={condo.id} value={condo.id}>{condo.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`border-l-4 p-4 ${
            messageIsError
              ? 'bg-red-100 border-red-500 text-red-700'
              : 'bg-blue-100 border-blue-500 text-blue-700'
          }`}
        >
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
            📥 Escanear QR (Entrada)
          </button>

          <button
            onClick={() => setShowEntryForm(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Entrada / Salida Manual
          </button>

          <button
            onClick={() => setShowWalkIn(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition mb-8"
          >
            Ingreso sin registro previo
          </button>


        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa o visitante..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          {term && (
            <div className="mt-3 divide-y">
              {filteredVisits.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">Sin visitas que coincidan.</p>
              ) : (
                filteredVisits.map((v) => {
                  const st = visitStatus(v)
                  return (
                    <div key={v.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{v.visitor_alias || 'Visita'}</p>
                        <p className="text-sm text-gray-600">
                          Placa {v.license_plate || '—'} · Unidad {unitLabel(v)}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${st.className}`}>
                        {st.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
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

        {showWalkIn && (
          <WalkInForm
            condominiumId={condominiumId}
            onClose={() => setShowWalkIn(false)}
            onSuccess={handleWalkInRegistered}
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
                <p className="text-lg font-semibold">{unitLabel(selectedVisit)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Vigencia</p>
                <p className="text-sm font-semibold">
                  {formatDateTime(selectedVisit.valid_from)} → {formatDateTime(selectedVisit.valid_until)}
                </p>
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
                    setMessageIsError(false)
                    setMessage('Entrada registrada ✓')
                    setSelectedVisit(null)
                    setTimeout(() => setMessage(''), 3000)
                    await loadData()
                  } catch (err) {
                    setMessageIsError(true)
                    setMessage(err.response?.data?.detail || 'Error registrando entrada')
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
        <EventList events={filteredEvents} />
      </div>
    </div>
  )
}
