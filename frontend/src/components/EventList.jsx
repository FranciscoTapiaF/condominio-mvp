import React from 'react'

export default function EventList({ events }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-bold text-gray-800">
          Eventos Recientes (últimas 2 horas)
        </h3>
      </div>

      <div className="divide-y max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Sin eventos
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">
                  {event.event_type === 'entry' ? '📥 ENTRADA' : '📤 SALIDA'}
                </p>
                {event.license_plate_detected && (
                  <p className="text-sm text-gray-600">
                    Placa: {event.license_plate_detected}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(event.occurred_at).toLocaleTimeString('es-CL')}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  event.event_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
