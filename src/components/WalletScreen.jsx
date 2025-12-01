import React, { useMemo } from "react";
import { useWallet } from "../services/WalletContext";
import { getAllSupportedChains } from "hfv-sdk";

import "../styles/WalletScreen.css";

// All logos are served from: /public/logo/*
const metamaskLogo = "/logo/metamask.png";

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
  );
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
  } = useWallet();

  // Pull all supported chains from your HFV SDK
  const chains = useMemo(() => getAllSupportedChains(), []);

  const isCurrentChain = (id) => {
    const hex = "0x" + Number(id).toString(16);
    return String(chainId || "").toLowerCase() === hex;
  };

  // Mobile detection
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Correct MetaMask deep link (real format)
  const openInMetaMask = () => {
    const currentURL = encodeURIComponent(window.location.href);
    window.location.href = `https://metamask.app.link/dapp/${currentURL}`;
  };

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
              <p>Optimized for wrapped native tokens and major stablecoins.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧩</div>
              <h3>Powered by HFV SDK</h3>
              <p>Live chain metadata, coins & prices.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Fully Non-Custodial</h3>
              <p>You maintain control. Every action is wallet-signed.</p>
            </div>
          </div>

          {/* Info cards */}
          <div className="info-cards">
            <InfoCard
              icon="🧠"
              title="1) How HFV Bridge Works"
              defaultOpen
            >
              <ul className="info-list">
                <li>Connect your wallet and bridge crypto across networks.</li>
                <li>The HFV SDK supplies chain metadata and real token data.</li>
                <li>Only trusted, liquid assets enabled by default.</li>
                <li>Your funds remain in your wallet—always.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="✨" title="2) Supported Chains">
              <ul className="info-list">
                <li>HFV Bridge supports 30+ verified EVM networks.</li>
                <li>Token & chain data are always synced with your SDK.</li>
                <li>Expandable without UI changes.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="💱" title="3) Bridging Steps">
              <ul className="info-list">
                <li>Select the source and destination networks.</li>
                <li>Choose a token and amount.</li>
                <li>Review the routing and fees.</li>
                <li>Approve & sign via your wallet.</li>
              </ul>
            </InfoCard>

            <InfoCard icon="🧾" title="4) Security & Fees">
              <ul className="info-list">
                <li>Pay normal gas fees on both networks.</li>
                <li>All transactions are on-chain and transparent.</li>
                <li>No custody, no centralized storage.</li>
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
                  <span>🔗</span> Connect Wallet
                </>
              )}
            </button>

            {error && <div className="error-message">{error}</div>}

            {/* MetaMask mobile deep link */}
            {isMobile && (
              <div className="metamask-deeplink">
                <p>Open this app directly in MetaMask:</p>
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
            <h2 className="connected-heading">Wallet Connected</h2>
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
            <h3>Switch Network</h3>
            <div className="chains-grid">
              {chains.map((c) => (
                <button
                  key={c.chainId}
                  onClick={() => switchChain(c.chainId)}
                  className={`chain-badge ${
                    isCurrentChain(c.chainId) ? "active" : ""
                  }`}
                >
                  {c.logo ? (
                    <img
                      src={c.logo}
                      alt={`${c.name} logo`}
                      className="chain-logo-img"
                    />
                  ) : (
                    <span className="chain-logo">⛓️</span>
                  )}
                  <span className="chain-name">
                    {c.name} {isCurrentChain(c.chainId) && "✓"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Supported Blockchains List */}
      <section className="supported-chains">
        <h3>Supported Blockchains</h3>
        <div className="chains-grid">
          {chains.map((chain) => (
            <a
              key={chain.chainId}
              className="chain-badge"
              href={chain.explorer || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {chain.logo ? (
                <img
                  src={chain.logo}
                  alt={`${chain.name} logo`}
                  className="chain-logo-img"
                />
              ) : (
                <span className="chain-logo">⛓️</span>
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

          <p>
            © 2022–2025 HFV Protocol Technologies Limited • Transparent by
            Design
          </p>

          <div className="footer-links">
            <a
              href="https://github.com/VTHash/hfv-bridge"
              target="_blank"
              rel="noopener noreferrer"
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
            >
              <img src="/logo/X.png" alt="Twitter" className="footer-icon" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default WalletScreen;