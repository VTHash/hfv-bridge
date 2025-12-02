// src/components/WalletScreen.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../services/WalletContext'
import { getAllSupportedChains } from 'hfv-sdk'
import { CHAIN_LOGOS } from '../config/chainLogos'
import '../styles/WalletScreen.css'
import { SUPPORTED_CHAINS } from '../config/walletConnectConfig'
const metamaskLogo = '/logo/metamask.png'

function InfoCard({ icon, title, children, defaultOpen = false }) {
  return (
    <details className="rs-info-card" {...(defaultOpen ? { open: true } : {})}>
      <summary className="rs-info-card__summary">
        <span className="rs-info-card__icon">{icon}</span>
        <span className="rs-info-card__title">{title}</span>
        <span className="rs-info-card__chev" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="rs-info-card__content">{children}</div>
    </details>
  )
}

const WalletScreen = () => {
  const {
    isConnected,
    address,
    chainId,
    connect,
    disconnect,
    switchChain,
    loading,
    error
  } = useWallet()

  const navigate = useNavigate()

  // Theme: dark / light
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-hfv-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  // Chains from HFV SDK
  const chains = useMemo(() => getAllSupportedChains(), [])

  const isCurrentChain = (id) => {
    const hex = '0x' + Number(id).toString(16)
    return String(chainId || '').toLowerCase() === hex
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  const openInMetaMask = () => {
    const currentURL = encodeURIComponent(window.location.href)
    window.location.href = `https://metamask.app.link/dapp/${currentURL}`
  }

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : ''

  return (
    <div className="rs-layout">
      {/* NAVBAR (fixed, Reserve-style) */}
      <header className="rs-navbar">
        <div className="rs-navbar__left">
          <div className="rs-brand">
            <img
              src="/logo/hfv-logo.png"
              alt="HFV Logo"
              className="rs-brand__logo"
            />
            <div className="rs-brand__text">
              <span className="rs-brand__title">HFV Bridge</span>
              <span className="rs-brand__subtitle">Wormhole powered</span>
            </div>
          </div>

          <nav className="rs-nav-links">
            <button className="rs-nav-link rs-nav-link--active">Bridge</button>
            <button
              className="rs-nav-link"
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
          <button
            type="button"
            className="rs-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {isConnected ? (
            <div className="rs-wallet-pill">
              <span className="rs-wallet-pill__status" />
              <span className="rs-wallet-pill__label">{shortAddress}</span>
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

      {/* MAIN */}
      <main className="rs-main">
        {/* HERO SECTION */}
        <section className="rs-hero">
          <div className="rs-hero__left">
            <h1 className="rs-hero__title">
              Bridge assets across
              <span className="rs-hero__accent"> HFV-supported networks.</span>
            </h1>
            <p className="rs-hero__subtitle">
              HFV Bridge lets you move liquidity safely between Ethereum, L2s
              and EVM chains using your own non-custodial wallet. Powered by
              the HFV SDK for chain metadata, token registries and live prices.
            </p>

            <ul className="rs-hero__bullets">
              <li>🔀 Cross-chain bridge for 30+ networks.</li>
              <li>💱 Focused on wrapped native assets & major stablecoins.</li>
              <li>🛡️ Non-custodial: you sign every transaction.</li>
              <li>📊 Powered  HFV API for quotes & prices.</li>
            </ul>
          </div>

          <div className="rs-hero__right">
            <div className="rs-card rs-wallet-card">
              <div className="rs-wallet-card__header">
                <h2>Get started</h2>
                <p>Connect your wallet to start bridging.</p>
              </div>

              <div className="rs-wallet-card__body">
                {isConnected ? (
                  <>
                    <div className="rs-wallet-row">
                      <span className="rs-wallet-row__label">Connected</span>
                      <span className="rs-wallet-row__value">
                        {shortAddress}
                      </span>
                    </div>
                    <div className="rs-wallet-row">
                      <span className="rs-wallet-row__label">Active chain</span>
                      <span className="rs-wallet-row__value">
                        {chainId ?? 'Not detected'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="rs-btn rs-btn--primary"
                      onClick={() => navigate('/bridge')}
                    >
                      Open Bridge
                    </button>

                    <button
                      type="button"
                      className="rs-btn rs-btn--ghost"
                      onClick={disconnect}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rs-btn rs-btn--primary"
                      onClick={connect}
                      disabled={loading}
                    >
                      {loading ? 'Connecting…' : 'Connect Wallet'}
                    </button>

                    <button
                      type="button"
                      className="rs-btn rs-btn--outline"
                      onClick={openInMetaMask}
                    >
                      <img
                        src={metamaskLogo}
                        alt="MetaMask"
                        className="rs-wallet-logo"
                      />
                      Open in MetaMask
                    </button>

                    {error && (
                      <div className="rs-error rs-error--inline">{error}</div>
                    )}

                    {isMobile && (
                      <p className="rs-wallet-card__hint">
                        On mobile, you can open this dApp directly from your
                        MetaMask browser.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / INFO CARDS */}
        <section className="rs-info-section">
          <div className="rs-info-grid">
            <InfoCard
              icon="🧠"
              title="1) What HFV Bridge does"
              defaultOpen
            >
              <ul className="rs-info-list">
                <li>
                  Move assets between HFV-supported chains using audited
                  cross-chain infrastructure.
                </li>
                <li>
                  The HFV SDK provides real chain metadata, token registries and
                  price feeds.
                </li>
                <li>
                  Only curated assets (wrapped natives & stablecoins) are
                  enabled by default.
                </li>
                <li>Everything is non-custodial and fully transparent.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="✨" title="2) Supported chains & tokens">
              <ul className="rs-info-list">
                <li>
                  HFV Bridge reads the full chain list directly.
                </li>
                <li>
                  Token lists are sourced from  registry / LI.FI-backed
                  datasets.
                </li>
                <li>Check the network and tokens supported.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="💱" title="3) Bridge flow">
              <ul className="rs-info-list">
                <li>Select a source and destination network.</li>
                <li>Choose the token and amount to bridge.</li>
                <li>
                  HFV API returns a quote, route and fee estimate via the SDK.
                </li>
                <li>You confirm and sign in your wallet.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="🧾" title="4) Security & gas">
              <ul className="rs-info-list">
                <li>You pay standard gas fees on both chains.</li>
                <li>
                  All operations go through audited Smart Contracts and
                  cross-chain messaging.
                </li>
                <li>HFV never takes custody of user funds.</li>
              </ul>
            </InfoCard>
          </div>
        </section>

        {/* SUPPORTED CHAINS GRID (logos from /public/logo) */}
        
        <section className="rs-chains-section">
  <div className="rs-chains-header">
    <h3>Supported blockchains</h3>
    <p>
      Chains are loaded from your HFV SDK configuration. Click any
      chain to open its block explorer.
    </p>
  </div>

  <div className="rs-chains-grid">
    {chains.map((chain) => {
      const chainKey = chain.key?.toLowerCase();

      const logoSrc =
        CHAIN_LOGOS[chainKey] ||
        CHAIN_LOGOS[chainKey?.replace(/[^a-z0-9]/g, "")] ||
        chain.logo ||
        "/logo/ethereum.png";

      // Prefer explorer from walletConnectConfig if present
      const wcMeta = SUPPORTED_CHAINS[chain.chainId];
      const explorer = chain.explorer || wcMeta?.explorer || "#";

      return (
        <a
          key={chain.chainId}
          className="rs-chain-card"
          href={explorer}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!explorer || explorer === "#") e.preventDefault();
          }}
        >
          <div className="rs-chain-card__icon-wrap">
            <img
              src={logoSrc}
              alt={`${chain.name} logo`}
              className="rs-chain-card__icon"
            />
          </div>
          <div className="rs-chain-card__text">
            <span className="rs-chain-card__name">{chain.name}</span>
            {explorer && explorer !== "#" && (
              <span className="rs-chain-card__explorer">
                Open explorer →
              </span>
            )}
          </div>
        </a>
      );
    })}
  </div>
</section>
      </main>

      {/* FOOTER */}
      <footer className="rs-footer">
        <div className="rs-footer__content">
          <div className="rs-footer__logos">
            <img
              src="/logo/hfv-logo.png"
              alt="HFV Logo"
              className="rs-footer__logo"
            />
           
          </div>
          <p className="rs-footer__text">
            © 2022–2025 HFV Protocol Technologies Limited • Transparent by
            Design
          </p>
          <div className="rs-footer__links">
            <a
              href="https://github.com/VTHash/hfv-bridge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/logo/github-mark.png"
                alt="GitHub"
                className="rs-footer__icon"
              />
            </a>
            <a
              href="https://x.com/HFVProtocol"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/logo/X.png" alt="X" className="rs-footer__icon" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default WalletScreen