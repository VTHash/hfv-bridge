import React, { useMemo, useState } from 'react'
import {
  HFVClient,
  HFVBridge,
  getAllSupportedChains,
  tokenRegistry
} from 'hfv-sdk'

import { useWallet } from '../services/WalletContext'
import './Dashboard.css' // reuse your existing card + HUD style

const fmt = (n) => Number(n || 0).toFixed(6)
const usd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  )

export default function BridgeDashboard() {
  const { address } = useWallet()

  const chains = useMemo(() => getAllSupportedChains(), [])

  // Default to Ethereum → Base, if present
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

  // Tokens from tokenRegistry (native wrapped + stablecoins only)
  const availableTokens = useMemo(() => {
    if (!fromChain) return []

    const registryEntry = tokenRegistry[fromChain.chainId] || []
    return registryEntry.filter((t) => {
      // You can adjust this to match your registry flags
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

  async function handleGetQuote() {
    if (!address) {
      setError('Connect your wallet first.')
      return
    }
    if (!fromChain || !toChain || !selectedToken || !amount) {
      setError('Please select from chain, to chain, token and amount.')
      return
    }
    if (fromChain.chainId === toChain.chainId) {
      setError('From chain and to chain must be different.')
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
      setError('Failed to fetch quote. Please try again.')
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
      setError('Failed to execute bridge. Please check your wallet and try again.')
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
      {/* Network selector row (like DustClaim, but for Bridge) */}
      <div className="network-dropdown-wrapper">
        <button type="button" className="network-selector" disabled>
          <span>HFV Bridge • Wormhole Powered</span>
        </button>
      </div>

      {/* Summary stats */}
      <div className="stats-row">
        <div className="stat-box primary">
          <div className="stat-label">Wallet</div>
          <div className="stat-value">
            {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">From → To</div>
          <div className="stat-value">
            {fromChain && toChain ? `${fromChain.name} → ${toChain.name}` : 'Select chains'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Selected Token</div>
          <div className="stat-value">
            {selectedToken ? selectedToken.symbol : 'Choose token'}
          </div>
        </div>
      </div>

      {/* Bridge HUD card */}
      <div className="chain-list">
        <div className="chain-card bridge-card">
          {/* FROM row */}
          <div className="chain-card-header">
            <div className="bridge-chain-select">
              <span className="bridge-label">From</span>
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

            <button
              type="button"
              className="btn-secondary bridge-flip"
              onClick={handleFlipChains}
            >
              ⇅
            </button>

            <div className="bridge-chain-select">
              <span className="bridge-label">To</span>
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

          {/* Token + Amount */}
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

            {/* Actions */}
            <div className="action-row">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGetQuote}
                disabled={quoteLoading || !address}
              >
                {quoteLoading ? '🔍 Fetching Quote…' : '🔍 Get Bridge Quote'}
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
    </div>
  )
}