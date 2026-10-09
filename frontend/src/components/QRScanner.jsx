import React, { useEffect, useRef } from 'react'
import QrScanner from 'qr-scanner'

export default function QRScanner({ onClose, onScanned }) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return

    scannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        onScanned(result.data)
      },
      {
        onDecodeError: () => {
          // Silenciar errores de escaneo
        },
        preferredCamera: 'environment',
        highlightCodeOutline: true,
      }
    )

    scannerRef.current.start()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy()
      }
    }
  }, [onScanned])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Escanear QR</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
              }}
            />
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">
            Apunta la cámara al código QR
          </p>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
