import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BridgeDashboard from './components/BridgeDashboard'
import { WalletProvider } from './services/WalletContext';
import WalletScreen from './components/WalletScreen';

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
   <WalletProvider>
      <WalletScreen />
    </WalletProvider>
    </div>
  )
}

export default App