import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import WalletScreen from './components/WalletScreen'
import BridgeDashboard from './components/BridgeDashboard'
import TipPill from './components/TipPill'

const App = () => {
  const [wallet, setWallet] = useState({
    isConnected: false,
    address: '',
    chainId: null
  })

  return (
    <div className="app">
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              wallet.isConnected ? (
                <BridgeDashboard wallet={wallet} setWallet={setWallet} />
              ) : (
                <WalletScreen wallet={wallet} setWallet={setWallet} />
              )
            }
          />
          <Route
            path="/bridge"
            element={
              wallet.isConnected ? (
                <BridgeDashboard wallet={wallet} setWallet={setWallet} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TipPill />
    </div>
  )
}

export default App