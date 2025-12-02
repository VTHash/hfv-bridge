import React, { useMemo } from 'react'
import { useWallet } from '../services/WalletContext'
import { getAllSupportedChains } from 'hfv-sdk'
import '../styles/WalletScreen.css'

import { CHAIN_LOGOS } from '../config/chainLogos'
import { SUPPORTED_CHAINS } from '../config/walletConnectConfig'

// All logos are served from: /public/logo/*
const metamaskLogo = '/logo/metamask.png'

/* -------------------------------------------------------
   Lightweight Accessible Expandable Card
------------------------------------------------------- */
function InfoCard({ icon, title, children, defaultOpen = false }) {
  return (
    <details className="info-card" {...(defaultOpen ? { open: true } : {})}>
      <summary className="info-card__summary">
        <span className="info-card__icon">{icon}</span>
        <span className="info-card__title">{title}</span>
        <span className="info-card__chev" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="info-card__content">{children}</div>
    </details>
  )
}

/* -------------------------------------------------------
   Helpers for logo + explorer
------------------------------------------------------- */

const getLogoSrc = (chain) => {
  // prefer the SDK key → CHAIN_LOGOS map
  const key = chain.key || chain.slug || chain.name?.toLowerCase()
  if (key && CHAIN_LOGOS[key]) return CHAIN_LOGOS[key]
  return '/logo/default.png'
}

const getExplorerUrl = (chain) => {
  const meta = SUPPORTED_CHAINS[chain.chainId] || {}
  return meta.explorer || chain.explorer || ''
}

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */
const WalletScreen = () => {
  const {
    isConnected,
    address,
    chainId,
    connect,
    disconnect,
    switchChain,
    loading,
    error,
  } = useWallet()

  // Pull all supported chains from your HFV SDK
  const chains = useMemo(() => getAllSupportedChains(), [])

  const isCurrentChain = (id) => {
    const hex = '0x' + Number(id).toString(16)
    return String(chainId || '').toLowerCase() === hex
  }

  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // MetaMask deep link
  const openInMetaMask = () => {
    const currentURL = encodeURIComponent(window.location.href)
    window.location.href = `https://metamask.app.link/dapp/${currentURL}`
  }

  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <p>
            Bridge and manage your crypto assets seamlessly across HFV-supported
            blockchains.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------
         NOT CONNECTED
      ------------------------------------------------------- */}
      {!isConnected ? (
        <section>
          {/* Highlights */}
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔀</div>
              <h3>Cross-Chain Bridge</h3>
              <p>Transfer assets across 30+ secure EVM networks.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💱</div>
              <h3>Native & Stablecoins</h3>
              <p>Optimised for wrapped native tokens and major stablecoins.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧩</div>
              <h3>Powered by HFV SDK</h3>
              <p>Live chain metadata, coins and prices, all from your SDK.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Fully Non-Custodial</h3>
              <p>You remain in control. Every action is signed from your wallet.</p>
            </div>
          </div>

          {/* Info cards */}
          <div className="info-cards">
            <InfoCard
              icon="🧠"
              title="1) How HFV Bridge works"
              defaultOpen
            >
              <ul className="info-list">
                <li>Connect your wallet and bridge crypto across networks.</li>
                <li>The HFV SDK supplies all chain metadata and token data.</li>
                <li>Only trusted, liquid assets are enabled by default.</li>
                <li>Your funds stay in your wallet at all times.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="✨" title="2) Supported chains">
              <ul className="info-list">
                <li>HFV Bridge supports 30+ verified EVM networks.</li>
                <li>Token and chain data stay in sync with your SDK.</li>
                <li>You can expand support later without changing this UI.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="💱" title="3) Bridging steps">
              <ul className="info-list">
                <li>Select source and destination networks.</li>
                <li>Choose a token and amount.</li>
                <li>Review the route, estimated time and fees.</li>
                <li>Approve and sign via your wallet.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="🧾" title="4) Security & fees">
              <ul className="info-list">
                <li>You pay normal gas fees on both networks.</li>
                <li>Transactions are executed on-chain and transparent.</li>
                <li>No central custody, no pooled user funds.</li>
              </ul>
            </InfoCard>
          </div>

          {/* Connect button */}
          <div className="connect-section">
            <button
              onClick={connect}
              disabled={loading}
              className="connect-button"
            >
              {loading ? (
                <>
                  <div className="spinner" /> Connecting…
                </>
              ) : (
                <>
                  <span>🔗</span> Connect wallet
                </>
              )}
            </button>

            {error && <div className="error-message">{error}</div>}

            {/* MetaMask mobile deep link */}
            {isMobile && (
              <div className="metamask-deeplink">
                <p>Open this dApp directly in MetaMask:</p>
                <img
                  src={metamaskLogo}
                  alt="Open in MetaMask"
                  className="metamask-logo"
                  onClick={openInMetaMask}
                />
              </div>
            )}
          </div>
        </section>
      ) : (
        /* -------------------------------------------------------
           CONNECTED VIEW
        ------------------------------------------------------- */
        <>
          <div className="connect-section">
            <h2 className="connected-heading">Wallet connected</h2>
            <p className="connected-address">
              <strong>Address:</strong> {address}
            </p>
            <p className="connected-chain">
              <strong>Chain ID:</strong> {chainId}
            </p>

            <button onClick={disconnect} className="connect-button">
              🔌 Disconnect
            </button>
          </div>

          {/* Switch Chain */}
          <div className="supported-chains">
            <h3>Switch network</h3>
            <div className="chains-grid">
              {chains.map((c) => (
                <button
                  key={c.chainId}
                  onClick={() => switchChain(c.chainId)}
                  className={`chain-badge ${
                    isCurrentChain(c.chainId) ? 'active' : ''
                  }`}
                >
                  <img
                    src={getLogoSrc(c)}
                    alt={`${c.name} logo`}
                    className="chain-logo-img"
                  />
                  <span className="chain-name">
                    {c.name} {isCurrentChain(c.chainId) && '✓'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Supported Blockchains List */}
      <section className="supported-chains">
        <h3>Supported blockchains</h3>
        <div className="chains-grid">
          {chains.map((chain) => {
            const explorer = getExplorerUrl(chain)
            const logoSrc = getLogoSrc(chain)

            return (
              <a
                key={chain.chainId}
                className="chain-badge"
                href={explorer || '#'}
                target="_blank"
                rel="noopener noreferrer"
                title={
                  explorer
                    ? `Open ${chain.name} block explorer`
                    : chain.name
                }
                onClick={(e) => {
                  if (!explorer) e.preventDefault()
                }}
              >
                <img
                  src={logoSrc}
                  alt={`${chain.name} logo`}
                  className="chain-logo-img"
                />
                <span className="chain-name">{chain.name}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-logos">
            <img
              src="/logo/hfv-logo.png"
              alt="HFV Logo"
              className="footer-logo"
            />
            <img
              src="/logo/dustclaim.png"
              alt="DustClaim Logo"
              className="footer-logo"
            />
          </div>

          <p>
            © 2022–2025 HFV Protocol Technologies Limited • Transparent by
            design.
          </p>

          <div className="footer-links">
            <a
              href="https://github.com/VTHash/hfv-bridge"
              target="_blank"
              rel="noopener noreferrer"
              title="View HFV Bridge source on GitHub"
            >
              <img
                src="/logo/github-mark.png"
                alt="GitHub"
                className="footer-icon"
              />
            </a>

            <a
              href="https://x.com/HFVProtocol"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow HFV Protocol on X"
            >
              <img src="/logo/X.png" alt="X (Twitter)" className="footer-icon" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default WalletScreen