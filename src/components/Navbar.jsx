// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../services/WalletContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isConnected, address, disconnect, connect, loading } = useWallet();

  // theme
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-hfv-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "dark" ? "light" : "dark"));

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  return (
    <header className="rs-navbar">
      <div className="rs-navbar__left">
        {/* Brand */}
        <div className="rs-brand">
          <img src="/logo/hfv-logo.png" className="rs-brand__logo" alt="HFV" />
          <div className="rs-brand__text">
            <span className="rs-brand__title">HFV Bridge</span>
            <span className="rs-brand__subtitle">Wormhole powered</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="rs-nav-links">
          <button
            className="rs-nav-link rs-nav-link--active"
            onClick={() => navigate("/")}
          >
            Bridge
          </button>

          <button
            className="rs-nav-link"
            onClick={() => navigate("/activity")}
          >
            Activity
          </button>

          <button
            className="rs-nav-link"
            onClick={() => window.open("https://hfvprotocol.org", "_blank")}
          >
            Docs
          </button>
        </nav>
      </div>

      {/* Right side */}
      <div className="rs-navbar__right">
        <button
          type="button"
          className="rs-theme-toggle"
          onClick={toggleTheme}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
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
            {loading ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;