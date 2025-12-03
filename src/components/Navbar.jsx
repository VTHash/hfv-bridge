// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWallet } from '../services/WalletContext'
import '../styles/WalletScreen.css' // rs-navbar styles already live here

const Navbar = () => {
  const { isConnected, address, connect, disconnect, loading } = useWallet()
  const navigate = useNavigate()
  const location = useLocation()

  // Theme: dark / light (same behaviour as before)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-hfv-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''

  // Active tab helper
  const isActive = (pathPrefix) =>
    location.pathname === pathPrefix ||
    location.pathname.startsWith(pathPrefix + '/')

  return (
    <header className="rs-navbar">
      <div className="rs-navbar__left">
        {/* Brand */}
        <button
          type="button"
          className="rs-brand"
          onClick={() => navigate('/')}
        >
          <img
            src="/logo/hfv-logo.png"
            alt="HFV Logo"
            className="rs-brand__logo"
          />
          <div className="rs-brand__text">
            <span className="rs-brand__title">HFV Bridge</span>
            <span className="rs-brand__subtitle">Wormhole powered</span>
          </div>
        </button>

        {/* Nav links */}
        <nav className="rs-nav-links">
          <button
            type="button"
            className={
              'rs-nav-link' + (isActive('/') ? ' rs-nav-link--active' : '')
            }
            onClick={() => navigate('/')}
          >
            Home
          </button>

          <button
            type="button"
            className={
              'rs-nav-link' +
              (isActive('/bridge') ? ' rs-nav-link--active' : '')
            }
            onClick={() => navigate('/bridge')}
          >
            Bridge
          </button>

          <button
            className={
              'rs-nav-link' +
              (isActive('/activity') ? ' rs-nav-link--active' : '')
            }
            type="button"
            onClick={() => navigate('/activity')}
          >
            Activity
          </button>

          <button
            className="rs-nav-link"
            type="button"
            onClick={() => window.open('https://hfvprotocol.org', '_blank')}
          >
            Docs
          </button>
        </nav>
      </div>

      <div className="rs-navbar__right">
        {/* Theme toggle */}
        <button
          type="button"
          className="rs-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>

        {/* Wallet pill / connect */}
        {isConnected ? (
          <div className="rs-wallet-pill">
            <span className="rs-wallet-pill__status" />
            <span className="rs-wallet-pill__label">{shortAddress}</span>
            {/* optional disconnect, as requested */}
            <button
              type="button"
              className="rs-wallet-pill__action"
              onClick={disconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="rs-nav-connect"
            onClick={connect}
            disabled={loading}
          >
            {loading ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  )
}

export default Navbar