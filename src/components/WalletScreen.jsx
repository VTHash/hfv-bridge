import React, { useMemo } from 'react'
import { useWallet } from '../services/WalletContext'
import { getAllSupportedChains } from 'hfv-sdk' // <-- from your SDK
import '../styles/WalletScreen.css'

const metamaskLogo = '/logo/metamask.png'

/** Lightweight, accessible accordion card */
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

  const chains = useMemo(() => getAllSupportedChains(), [])

  const handleConnect = async () => {
    await connect()
  }
  const handleDisconnect = async () => {
    await disconnect()
  }

  const isCurrentChain = (id) => {
    const hex = '0x' + Number(id).toString(16)
    return String(chainId || '').toLowerCase() === hex
  }

  // Detect mobile device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  // MetaMask deep link (keep your DustClaim link or change domain)
  const openInMetaMask = () => {
    const dappUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://metamask.app.link/dapp/https://dustclaim.xyz`
  }

  return (
    <main className="container">
      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <p>Claim & bridge your crypto across multiple blockchains with HFV Bridge.</p>
        </div>
      </section>

      {/* CONNECT / INFO */}
      {!isConnected ? (
        <section>
          {/* Quick feature highlights */}
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔀</div>
              <h3>Multi-Chain Bridge</h3>
              <p>Bridge assets across 30+ EVM & L2 networks in one UI.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💱</div>
              <h3>Native + Stablecoins</h3>
              <p>Focus on wrapped native tokens & stablecoins for safe routing.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧩</div>
              <h3>Powered by HFV SDK</h3>
              <p>Chains, tokens & prices are all powered by your own SDK.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Non-Custodial</h3>
              <p>Your wallet, your keys. You approve every bridge transaction.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="info-cards">
            <InfoCard
              icon="🧠"
              title="1) What HFV Bridge does (at a glance)"
              defaultOpen
            >
              <ul className="info-list">
                <li>
                  Connect your wallet and <strong>bridge tokens</strong> between HFV-supported
                  chains.
                </li>
                <li>
                  We use your <strong>HFV SDK</strong> for real chain metadata, token logos &
                  prices.
                </li>
                <li>
                  Only <strong>native wrapped tokens & stables</strong> are enabled by default for
                  safety.
                </li>
                <li>
                  Every action is <strong>non-custodial</strong> — you sign from your wallet.
                </li>
              </ul>
            </InfoCard>

            <InfoCard icon="✨" title="2) Supported chains & tokens">
              <ul className="info-list">
                <li>We mirror your SDK’s 38+ chains registry.</li>
                <li>Each chain pulls its token list from your on-chain / LI.FI-based registry.</li>
                <li>
                  You can tighten the list to <strong>blue-chip stables & wrapped natives</strong>.
                </li>
                <li>Later you can expand to more tokens without changing this UI.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="💱" title="3) Bridge flow (simplified)">
              <ul className="info-list">
                <li>Select a <strong>from chain</strong>, <strong>to chain</strong>, token & amount.</li>
                <li>
                  We call your <strong>HFV Bridge API</strong> via <code>hfv-sdk</code> to get quote &
                  fees.
                </li>
                <li>Review the quote, then execute via your wallet.</li>
                <li>Track status until the destination chain confirms the transfer.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="🧾" title="4) Security & gas">
              <ul className="info-list">
                <li>You pay standard gas fees on source & destination chains.</li>
                <li>We never take custody; bridging happens via audited on-chain contracts.</li>
                <li>HFV SDK keeps everything configurable behind the scenes.</li>
              </ul>
            </InfoCard>
          </div>

          <div className="connect-section">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="connect-button"
            >
              {loading ? (
                <>
                  <div className="spinner" /> Connecting…
                </>
              ) : (
                <>
                  <span>🔗</span> Connect Wallet
                </>
              )}
            </button>

            {error && <div className="error-message">{error}</div>}

            {/* MetaMask Deep-Link Logo (Mobile Only) */}
            {isMobile && (
              <div className="metamask-deeplink">
                <p>Or open directly in MetaMask:</p>
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
        <>
          <div className="connect-section">
            <h2 className="connected-heading">Wallet Connected ✅</h2>
            <p className="connected-address">
              <strong>Address:</strong> {address}
            </p>
            <p className="connected-chain">
              <strong>Chain ID:</strong> {chainId}
            </p>
            <button onClick={handleDisconnect} className="connect-button">
              🔌 Disconnect
            </button>
          </div>

          {/* Recap cards */}
          <div className="info-cards">
            <InfoCard icon="🧠" title="HFV Bridge (recap)" defaultOpen>
              <p>Bridge your assets across HFV-supported chains using your own SDK + API.</p>
            </InfoCard>
            <InfoCard icon="✨" title="Curated tokens only">
              <p>We focus on wrapped natives & stables from your token registry for safety.</p>
            </InfoCard>
          </div>

          {/* Switch Chain */}
          <div className="supported-chains">
            <h3>Switch Chain</h3>
            <div className="chains-grid">
              {chains.map((chain) => (
                <button
                  key={chain.chainId}
                  onClick={() => switchChain(chain.chainId)}
                  className={`chain-badge ${
                    isCurrentChain(chain.chainId) ? 'active' : ''
                  }`}
                >
                  {chain.logo ? (
                    <img
                      src={chain.logo}
                      alt={`${chain.name} logo`}
                      className="chain-logo-img"
                    />
                  ) : (
                    <span className="chain-logo" aria-hidden>
                      ⛓️
                    </span>
                  )}
                  <span className="chain-name">
                    {chain.name} {isCurrentChain(chain.chainId) && '✓'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Supported blockchains (links to explorers, if present in SDK) */}
      <section className="supported-chains">
        <h3>Supported Blockchains</h3>
        <div className="chains-grid">
          {chains.map((chain) => (
            <a
              key={chain.chainId}
              className="chain-badge"
              href={chain.explorer || '#'}
              target="_blank"
              rel="noopener noreferrer"
              title={chain.explorer ? `Open ${chain.name} explorer` : chain.name}
              onClick={(e) => {
                if (!chain.explorer) e.preventDefault()
              }}
            >
              {chain.logo ? (
                <img
                  src={chain.logo}
                  alt={`${chain.name} logo`}
                  className="chain-logo-img"
                />
              ) : (
                <span className="chain-logo" aria-hidden>
                  ⛓️
                </span>
              )}
              <span className="chain-name">{chain.name}</span>
            </a>
          ))}
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
          <p>© 2022–2025 HFV Protocol Technologies Limited • Transparent by Design</p>

          <div className="footer-links">
            <a
              href="https://github.com/VTHash/hfv-bridge"
              target="_blank"
              rel="noopener noreferrer"
              title="View HFV Bridge Source on GitHub"
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
              title="Follow us on X (Twitter)"
            >
              <img
                src="/logo/X.png"
                alt="Twitter"
                className="footer-icon"
              />
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default WalletScreen