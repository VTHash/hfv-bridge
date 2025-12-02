// src/components/WalletScreen.jsx
import React, { useMemo } from "react";
import { useWallet } from "../services/WalletContext";
import { getAllSupportedChains } from "hfv-sdk";
import { CHAIN_LOGOS } from "../config/chainLogos";
import "../styles/WalletScreen.css";

const metamaskLogo = "/logo/metamask.png";

/* ---------------------------------------
   Small Expandable Info Section Component
----------------------------------------- */
function InfoCard({ title, children }) {
  return (
    <div className="rs-info-card">
      <div className="rs-info-title">{title}</div>
      <div className="rs-info-body">{children}</div>
    </div>
  );
}

/* ---------------------------------------
   Main Wallet Screen
----------------------------------------- */
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

  const chains = useMemo(() => getAllSupportedChains(), []);

  const isCurrent = (id) =>
    "0x" + Number(id).toString(16) === String(chainId).toLowerCase();

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const openInMetaMask = () => {
    const url = encodeURIComponent(window.location.href);
    window.location.href = `https://metamask.app.link/dapp/${url}`;
  };

  return (
    <div className="rs-wrapper">

      {/* ================= NAVBAR ================= */}
      <header className="rs-navbar">
        <div className="rs-nav-left">
          <img src="/logo/hfv-logo.png" className="rs-nav-logo" />
          <span className="rs-nav-title">HFV Bridge</span>
        </div>

        <div className="rs-nav-right">
          <button className="rs-theme-toggle">🌗</button>

          {!isConnected ? (
            <button
              className="rs-connect-btn"
              onClick={connect}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <button className="rs-connect-btn" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* =========================================== */}
      {/* BODY */}
      {/* =========================================== */}
      <div className="rs-body">

        {/* ---- HERO TEXT ---- */}
        <div className="rs-hero">
          <h1>Bridge your assets across HFV-supported blockchains</h1>
          <p>
            Secure multi-chain transfers powered by HFV SDK and Wormhole routing.
            Non-custodial. Fast. Professional-grade.
          </p>
        </div>

        {/* ======= NOT CONNECTED VIEW ======= */}
        {!isConnected ? (
          <>
            {/* Feature grid */}
            <div className="rs-features">
              <div className="rs-feature">
                <div className="rs-feature-icon">🔀</div>
                <h3>Cross-Chain Transfers</h3>
                <p>Bridge assets across 30+ HFV-supported chains.</p>
              </div>

              <div className="rs-feature">
                <div className="rs-feature-icon">💱</div>
                <h3>Native & Stablecoins</h3>
                <p>Liquid wrapped native tokens and blue-chip stablecoins.</p>
              </div>

              <div className="rs-feature">
                <div className="rs-feature-icon">🧩</div>
                <h3>Powered by HFV SDK</h3>
                <p>Live chain metadata, prices, token lists and routing.</p>
              </div>

              <div className="rs-feature">
                <div className="rs-feature-icon">🛡️</div>
                <h3>Non-Custodial</h3>
                <p>Your wallet. Your keys. Your approvals.</p>
              </div>
            </div>

            {/* Info sections */}
            <InfoCard title="How HFV Bridge Works">
              <ul>
                <li>Connect your wallet and choose source/destination chains.</li>
                <li>HFV SDK fetches accurate chain metadata + token data.</li>
                <li>Quotes routed via HFV Bridge API (Wormhole integration).</li>
                <li>Sign transactions directly from your wallet.</li>
              </ul>
            </InfoCard>

            <InfoCard title="Supported Blockchains">
              <p>All networks are synced directly from hfv-sdk.</p>
              <div className="rs-chain-badges">
                {chains.map((c) => (
                  <div className="rs-chain-badge" key={c.chainId}>
                    <img
                      src={CHAIN_LOGOS[c.key] || "/logo/default.png"}
                      className="rs-chain-badge-icon"
                    />
                    {c.name}
                  </div>
                ))}
              </div>
            </InfoCard>

            {/* Connect section */}
            <div className="rs-connect-section">
              <button
                onClick={connect}
                className="rs-connect-big"
                disabled={loading}
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>

              {error && <div className="rs-error">{error}</div>}

              {isMobile && (
                <div className="rs-mm-mobile">
                  <p>Open in MetaMask:</p>
                  <img
                    src={metamaskLogo}
                    className="rs-mm-logo"
                    onClick={openInMetaMask}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* ======= CONNECTED VIEW ======= */
          <>
            <div className="rs-connected-box">
              <h2>Wallet Connected</h2>
              <p>
                <strong>Address:</strong> {address}
              </p>
              <p>
                <strong>Chain ID:</strong> {chainId}
              </p>
            </div>

            {/* Switch chain (Reserve-style buttons) */}
            <div className="rs-switch-block">
              <h3>Switch Network</h3>
              <div className="rs-chain-buttons">
                {chains.map((c) => (
                  <button
                    key={c.chainId}
                    className={`rs-chain-select-btn ${
                      isCurrent(c.chainId) ? "active" : ""
                    }`}
                    onClick={() => switchChain(c.chainId)}
                  >
                    <img
                      src={CHAIN_LOGOS[c.key] || "/logo/default.png"}
                      className="rs-chain-btn-icon"
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* FOOTER */}
        <footer className="rs-footer">
          <p>© HFV Protocol Technologies Limited</p>
          <div className="rs-footer-links">
            <a href="https://github.com/VTHash/hfv-bridge">
              <img src="/logo/github-mark.png" className="rs-footer-icon" />
            </a>
            <a href="https://x.com/HFVProtocol">
              <img src="/logo/X.png" className="rs-footer-icon" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default WalletScreen;