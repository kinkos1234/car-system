'use client'

import { useState } from 'react'
import { authAPI, carAPI, customerAPI, dashboardAPI } from '@/utils/api'

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await authAPI.login({
        email: 'admin@comadj.com',
        password: 'admin123'
      })
      setResult(response)
      setToken(response.token)
      if (response.token) {
        sessionStorage.setItem('token', response.token)
      }
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testGetCars = async () => {
    setLoading(true)
    try {
      const response = await carAPI.getAll({ page: 1, limit: 5 })
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testCreateCar = async () => {
    setLoading(true)
    try {
      const response = await carAPI.create({
        car_number: `TEST-${Date.now().toString().slice(-3)}`,
        car_model: 'Test Model',
        corporation: 'AutoMaker',
        status: 'ACTIVE'
      })
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testGetCustomers = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.getAll({ page: 1, limit: 5 })
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testCreateCustomer = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.create({
        name: 'Test Customer',
        email: `test${Date.now()}@example.com`,
        corporation: 'AutoMaker',
        contact: '010-1234-5678'
      })
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testDashboard = async () => {
    setLoading(true)
    try {
      const response = await dashboardAPI.getData()
      setResult(response)
    } catch (error: any) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Token Status</label>
              <p className="text-sm text-gray-600 break-all">
                {token ? `✅ ${token.substring(0, 50)}...` : '❌ No token'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Server Status</label>
              <p className="text-sm text-green-600">✅ Next.js Dev Server Running</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Login API'}
            </button>
            
            <button
              onClick={testGetCars}
              disabled={loading || !token}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Get Cars API'}
            </button>
            
            <button
              onClick={testCreateCar}
              disabled={loading || !token}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Create Car API'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Response</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {result ? JSON.stringify(result, null, 2) : 'No response yet. Click a test button above.'}
          </pre>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>First, click "Test Login API" to authenticate and get a token</li>
            <li>Then try "Test Get Cars API" to fetch car data from Supabase</li>
            <li>Finally, test "Test Create Car API" to create a new car record</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 