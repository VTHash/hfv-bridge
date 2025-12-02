import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import WalletScreen from './components/WalletScreen'
import BridgeDashboard from './components/BridgeDashboard'
import { useWallet } from './services/WalletContext'

const App = () => {
  const { isConnected } = useWallet()

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          {/* Home: show wallet connect screen or bridge depending on connection */}
          <Route
            path="/"
            element={isConnected ? <BridgeDashboard /> : <WalletScreen />}
          />

          {/* Direct /bridge route – redirect home if wallet not connected */}
          <Route
            path="/bridge"
            element={isConnected ? <BridgeDashboard /> : <Navigate to="/" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
