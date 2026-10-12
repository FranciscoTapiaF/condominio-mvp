import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function RoleSelector() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await authAPI.getMe()
        const availableRoles = response.data.roles || []
        setRoles(availableRoles)

        if (availableRoles.length === 1) {
          const role = availableRoles[0]
          if (role === 'propietario') {
            navigate('/owner-dashboard')
          } else if (role === 'administrador') {
            navigate('/admin-dashboard')
          } else {
            navigate('/dashboard')
          }
        }
      } catch (err) {
        console.error('Error cargando roles', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [navigate])

  const handleRoleSelect = (role) => {
    localStorage.setItem('selectedRole', role)
    if (role === 'propietario') {
      navigate('/owner-dashboard')
    } else if (role === 'administrador') {
      navigate('/admin-dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Selecciona tu rol</h1>
        <p className="text-center text-gray-600 mb-8">Elige la vista que deseas usar</p>

        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => {
            const label =
              role === 'guardia'
                ? 'Portería'
                : role === 'administrador'
                  ? 'Administrador'
                  : 'Propietario'

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-6 text-left transition"
              >
                <div className="text-sm uppercase tracking-wide opacity-80">Rol</div>
                <div className="text-2xl font-bold mt-2">{label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
