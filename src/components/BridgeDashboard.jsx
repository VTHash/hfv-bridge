import React, { useMemo, useState } from 'react'
import {
  HFVClient,
  HFVBridge,
  getAllSupportedChains,
  tokenRegistry
} from 'hfv-sdk'

import { useWallet } from '../services/WalletContext'
import { CHAIN_LOGOS } from '../config/chainLogos'
import TokenRow from '../components/TokenRow'
import Shimmer from '../components/Shimmer'
import '../styles/Dashboard.css'
import '../styles/TokenRow.css'

// Simple formatters
const fmt = (n) => Number(n || 0).toFixed(6)
const usd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  )

// Resolve chain logo from CHAIN_LOGOS or fallbacks
const getChainLogo = (chain) => {
  if (!chain) return '/logo/default.png'

  if (chain.key && CHAIN_LOGOS[chain.key]) return CHAIN_LOGOS[chain.key]

  const key = String(chain.name || '').toLowerCase()
  if (CHAIN_LOGOS[key]) return CHAIN_LOGOS[key]

  return '/logo/default.png'
}

export default function BridgeDashboard() {
  const { address } = useWallet()

  // All chains from your HFV SDK
  const chains = useMemo(() => getAllSupportedChains(), [])

  // Default FROM / TO
  const defaultFrom =
    chains.find((c) => c.key === 'ethereum') || chains[0] || null
  const defaultTo =
    chains.find((c) => c.key === 'base') || chains[1] || chains[0] || null

  const [fromChainId, setFromChainId] = useState(defaultFrom?.chainId || 1)
  const [toChainId, setToChainId] = useState(defaultTo?.chainId || 56)
  const [selectedTokenAddress, setSelectedTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [bridgeLoading, setBridgeLoading] = useState(false)
  const [bridgeResult, setBridgeResult] = useState(null)
  const [error, setError] = useState('')

  // Per-chain "show all tokens" state (pill that opens TokenRow list)
  const [expandedChains, setExpandedChains] = useState({}) // { [chainId]: true | false }

  const toggleChainTokens = (chainId) => {
    setExpandedChains((prev) => ({
      ...prev,
      [chainId]: !prev[chainId]
    }))
  }

  // HFV SDK client + bridge
  const client = useMemo(
    () =>
      new HFVClient({
        env: 'mainnet',
        apiBaseUrl:
          import.meta.env.VITE_HFV_API_BASE_URL ||
          'https://hfv-api.onrender.com/api'
      }),
    []
  )

  const hfvBridge = useMemo(() => new HFVBridge(client), [client])

  const fromChain = chains.find((c) => c.chainId === fromChainId) || null
  const toChain = chains.find((c) => c.chainId === toChainId) || null

  // Available tokens for *current FROM chain* (for the bridge dropdown)
  const availableTokens = useMemo(() => {
    if (!fromChain) return []
    const registryEntry = tokenRegistry[fromChain.chainId] || []
    return registryEntry.filter((t) => {
      return (
        t.isNativeWrapped ||
        t.isStablecoin ||
        ['USDC', 'USDT', 'DAI'].includes(t.symbol)
      )
    })
  }, [fromChain])

  const selectedToken = useMemo(() => {
    if (!fromChain || !selectedTokenAddress) return null
    const registryEntry = tokenRegistry[fromChain.chainId] || []
    return (
      registryEntry.find(
        (t) => t.address.toLowerCase() === selectedTokenAddress.toLowerCase()
      ) || null
    )
  }, [fromChain, selectedTokenAddress])

  // ---------- Bridge actions ----------

  async function handleGetQuote() {
    if (!address) {
      setError('Please connect your wallet first.')
      return
    }
    if (!fromChain || !toChain || !selectedToken || !amount) {
      setError('Select source chain, destination chain, token and amount.')
      return
    }
    if (fromChain.chainId === toChain.chainId) {
      setError('Source and destination networks must be different.')
      return
    }

    setError('')
    setQuote(null)
    setBridgeResult(null)
    setQuoteLoading(true)

    try {
      const res = await hfvBridge.getQuote({
        fromChain: fromChain.key || fromChain.name,
        toChain: toChain.key || toChain.name,
        token: selectedToken.symbol,
        amount,
        recipient: address
      })

      setQuote(res)
    } catch (e) {
      console.error('Bridge quote error:', e)
      setError('Failed to fetch a quote. Please try again.')
    } finally {
      setQuoteLoading(false)
    }
  }

  async function handleExecuteBridge() {
    if (!quote || !fromChain || !toChain || !selectedToken || !amount) return

    setError('')
    setBridgeLoading(true)
    setBridgeResult(null)

    try {
      const res = await hfvBridge.bridge({
        fromChain: fromChain.key || fromChain.name,
        toChain: toChain.key || toChain.name,
        token: selectedToken.symbol,
        amount,
        recipient: address,
        quoteId: quote.quoteId
      })

      setBridgeResult(res)
    } catch (e) {
      console.error('Bridge execute error:', e)
      setError(
        'Bridge transaction failed. Please check your wallet and try again.'
      )
    } finally {
      setBridgeLoading(false)
    }
  }

  function handleFlipChains() {
    setFromChainId(toChainId)
    setToChainId(fromChainId)
    setQuote(null)
    setBridgeResult(null)
  }

  return (
    <div className="dashboard">
      {/* Simple label pill at top */}
      <div className="network-dropdown-wrapper">
        <button type="button" className="network-selector" disabled>
          <span>HFV Bridge • Wormhole Powered</span>
        </button>
      </div>

      {/* --------------------------------------------------
           1) BRIDGE HUD CARD (keep all logic here)
      -------------------------------------------------- */}
      <div className="chain-list">
        <div className="chain-card bridge-card">
          {/* FROM / TO row with logos and selects */}
          <div className="chain-card-header">
            <div className="bridge-chain-select">
              <span className="bridge-label">From</span>
              <div className="bridge-select-wrapper">
                {fromChain && (
                  <img
                    src={getChainLogo(fromChain)}
                    alt={`${fromChain.name} logo`}
                    className="bridge-chain-logo"
                  />
                )}
                <select
                  className="bridge-select"
                  value={fromChainId}
                  onChange={(e) => {
                    setFromChainId(Number(e.target.value))
                    setQuote(null)
                    setBridgeResult(null)
                  }}
                >
                  {chains.map((c) => (
                    <option key={c.chainId} value={c.chainId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary bridge-flip"
              onClick={handleFlipChains}
            >
              ⇅
            </button>

            <div className="bridge-chain-select">
              <span className="bridge-label">To</span>
              <div className="bridge-select-wrapper">
                {toChain && (
                  <img
                    src={getChainLogo(toChain)}
                    alt={`${toChain.name} logo`}
                    className="bridge-chain-logo"
                  />
                )}
                <select
                  className="bridge-select"
                  value={toChainId}
                  onChange={(e) => {
                    setToChainId(Number(e.target.value))
                    setQuote(null)
                    setBridgeResult(null)
                  }}
                >
                  {chains.map((c) => (
                    <option key={c.chainId} value={c.chainId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Token + Amount row */}
          <div className="chain-card-body">
            <div className="bridge-row">
              <div className="bridge-field">
                <span className="bridge-label">Token</span>
                <select
                  className="bridge-select"
                  value={selectedTokenAddress}
                  onChange={(e) => {
                    setSelectedTokenAddress(e.target.value)
                    setQuote(null)
                    setBridgeResult(null)
                  }}
                >
                  <option value="">Select token</option>
                  {availableTokens.map((t) => (
                    <option key={t.address} value={t.address}>
                      {t.symbol} {t.isStablecoin ? '(Stable)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bridge-field">
                <span className="bridge-label">Amount</span>
                <input
                  className="bridge-input"
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setQuote(null)
                    setBridgeResult(null)
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-row">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGetQuote}
                disabled={quoteLoading || !address}
              >
                {quoteLoading ? '🔍 Fetching quote…' : '🔍 Get Bridge Quote'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleExecuteBridge}
                disabled={!quote || bridgeLoading || !address}
              >
                {bridgeLoading ? '🚀 Bridging…' : '🚀 Execute Bridge'}
              </button>
            </div>

            {/* Quote summary */}
            {quote && (
              <div className="price-item bridge-quote">
                <span>Estimated Output</span>
                <span>
                  {fmt(quote.estimatedOutputAmount)}{' '}
                  {selectedToken ? selectedToken.symbol : ''}
                  {' • '}
                  Gas ≈ {usd(quote.estimatedGasUsd)}
                </span>
              </div>
            )}

            {/* Bridge result / tracking */}
            {bridgeResult && (
              <div className="dust-footer">
                🌉 Bridge started. Tracking ID:{' '}
                <code>{bridgeResult.trackingId}</code>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-message" style={{ marginTop: 8 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------
           2) CHAIN CARDS LIST (DustClaim-style, with TokenRow)
      -------------------------------------------------- */}
      <div className="chain-list">
        {chains.map((chain) => {
          const logoSrc = getChainLogo(chain)
          const registryEntry = tokenRegistry[chain.chainId] || []
          const tokensForCard = registryEntry.filter((t) => {
            // Same safety filter: wrapped native + stables + blue chips
            return (
              t.isNativeWrapped ||
              t.isStablecoin ||
              ['USDC', 'USDT', 'DAI'].includes(t.symbol)
            )
          })

          const isExpanded = !!expandedChains[chain.chainId]
          const visibleTokens = isExpanded
            ? tokensForCard
            : tokensForCard.slice(0, 3)

          return (
            <div key={chain.chainId} className="chain-card">
              <div className="chain-card-header">
                {/* Left side: [ SYMBOL • Name ] pill style */}
                <div className="chain-card-title">
                  <div className="chain-pill">
                    <img
                      src={logoSrc}
                      alt={`${chain.name} logo`}
                      className="chain-card-icon"
                    />
                    <span className="chain-pill-symbol">
                      {chain.symbol || '—'}
                    </span>
                    <span className="chain-pill-dot">•</span>
                    <span className="chain-pill-name">{chain.name}</span>
                  </div>
                </div>

                {/* Right: quick set-from / set-to buttons */}
                <div className="chain-card-native">
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => {
                      setFromChainId(chain.chainId)
                      setQuote(null)
                      setBridgeResult(null)
                    }}
                  >
                    Set as From
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11, marginLeft: 6 }}
                    onClick={() => {
                      setToChainId(chain.chainId)
                      setQuote(null)
                      setBridgeResult(null)
                    }}
                  >
                    Set as To
                  </button>
                </div>
              </div>

              <div className="chain-card-body">
                {visibleTokens.length === 0 ? (
                  <div className="price-item">
                    <span>Supported tokens</span>
                    <span>Coming soon</span>
                  </div>
                ) : (
                  visibleTokens.map((t) => {
                    const tokenForRow = {
                      ...t,
                      chainId: chain.chainId,
                      // ensure fields TokenRow expects exist (even if 0)
                      balance: t.balance ?? 0,
                      value: t.value ?? t.priceUSD ?? 0
                    }
                    return (
                      <TokenRow
                        key={`${chain.chainId}-${t.address}`}
                        token={tokenForRow}
                      />
                    )
                  })
                )}

                {/* Pill to open full TokenRow list */}
                {tokensForCard.length > 3 && (
                  <div className="token-more">
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: '3px 10px',
                        fontSize: 11,
                        borderRadius: 999
                      }}
                      onClick={() => toggleChainTokens(chain.chainId)}
                    >
                      {isExpanded
                        ? 'Hide tokens'
                        : `View all ${tokensForCard.length} tokens`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}