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
  <Route path="/" element={<WalletScreen />} />
  <Route path="/bridge" element={<BridgeDashboard />} />
  
</Routes>
      </main>
    </div>
  )
}

export default App
