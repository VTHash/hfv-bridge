// src/components/BridgeDashboard.jsx
import React, { useMemo, useState, useEffect } from 'react'
import {
  HFVClient,
  HFVBridge,
  getAllSupportedChains,
  tokenRegistry
} from 'hfv-sdk'
import {
  Contract,
  formatUnits,
  parseUnits,
  JsonRpcProvider
} from 'ethers'

import { useWallet } from '../services/WalletContext'
import { getMultipleNativePrices, getTokenUsdPrices } from '../services/priceService'

import '../styles/Dashboard.css'
import TokenRow from '../components/TokenRow'
import { CHAIN_LOGOS } from '../config/chainLogos'
import ChainSelect from './ChainSelect'
import Navbar from './Navbar'

// ---------------------------------------------
// Format helpers
// ---------------------------------------------
const fmt = (n) => Number(n || 0).toFixed(6)
const usd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(n || 0)
  )

// ---------------------------------------------
// HFV API base (still used by HFV SDK only)
// ---------------------------------------------
const API_BASE =
  import.meta.env.VITE_HFV_API_BASE_URL ||
  'https://hfv-api.onrender.com/api'

// ---------------------------------------------
// Minimal ERC-20 ABI for ethers.js
// ---------------------------------------------
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)']

// ---------------------------------------------
// Public RPC URLs per chain for on-chain balances
// ---------------------------------------------
const RPC_URLS = {
  1: 'https://eth.public-rpc.com', // Ethereum
  8453: 'https://base-rpc.publicnode.com', // Base
  56: 'https://bsc-dataseed.binance.org', // BSC
  137: 'https://polygon-rpc.com', // Polygon
  42161: 'https://arbitrum-one-rpc.publicnode.com', // Arbitrum
  10: 'https://mainnet.optimism.io', // Optimism
  43114: 'https://api.avax.network/ext/bc/C/rpc' // Avalanche
}

// ---------------------------------------------
// Bridge router ABI (ethers fallback)
// ---------------------------------------------
const HFV_BRIDGE_ABI = [
  'function quoteBridge(address token,uint256 amount,uint256 dstChainId,address recipient) view returns (uint256,uint256,uint256)',
  'function bridgeToken(address token,uint256 amount,uint256 dstChainId,address recipient) payable'
]

// ---------------------------------------------
// Per-chain router addresses for ethers fallback
// ---------------------------------------------
const BRIDGE_ROUTER_ADDRESSES = {
  1: import.meta.env.VITE_HFV_BRIDGE_ROUTER_ETHEREUM,
  8453: import.meta.env.VITE_HFV_BRIDGE_ROUTER_BASE,
  56: import.meta.env.VITE_HFV_BRIDGE_ROUTER_BSC,
  137: import.meta.env.VITE_HFV_BRIDGE_ROUTER_POLYGON,
  42161: import.meta.env.VITE_HFV_BRIDGE_ROUTER_ARBITRUM,
  10: import.meta.env.VITE_HFV_BRIDGE_ROUTER_OPTIMISM,
  43114: import.meta.env.VITE_HFV_BRIDGE_ROUTER_AVALANCHE
}

// Fallback router for any chain not in the map
const FALLBACK_ROUTER_ADDRESS = import.meta.env.VITE_HFV_BRIDGE_ROUTER || ''

const getRouterAddressForChain = (chainId) =>
  BRIDGE_ROUTER_ADDRESSES[chainId] || FALLBACK_ROUTER_ADDRESS || ''

// ---------------------------------------------
// Helper: chain logo resolver
// ---------------------------------------------
const getChainLogo = (chain) => {
  if (!chain) return '/logo/default.png'

  if (chain.key && CHAIN_LOGOS[chain.key]) return CHAIN_LOGOS[chain.key]

  const nameKey = String(chain.name || '').toLowerCase()
  if (CHAIN_LOGOS[nameKey]) return CHAIN_LOGOS[nameKey]

  return '/logo/default.png'
}

// ---------------------------------------------
// Tiny toast hook
// ---------------------------------------------
function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return { toast, showToast }
}

// ---------------------------------------------
// Main component
// ---------------------------------------------
export default function BridgeDashboard() {
  const { address, provider } = useWallet()
  const { toast, showToast } = useToast()

  // Chains from HFV SDK
  const chains = useMemo(() => getAllSupportedChains(), [])

  // Build a helper map: chainId -> token list
  const tokenRegistryById = useMemo(() => {
    const map = {}
    Object.values(tokenRegistry).forEach((tokens) => {
      if (!Array.isArray(tokens) || tokens.length === 0) return
      const id = tokens[0]?.chainId
      if (id) map[id] = tokens
    })
    return map
  }, [])

  // Default FROM / TO (use last used from localStorage if present)
  const defaultFrom =
    chains.find((c) => c.key === 'ethereum') || chains[0] || null
  const defaultTo =
    chains.find((c) => c.key === 'base') || chains[1] || chains[0] || null

  const storedFrom = Number(
    window.localStorage.getItem('hfv:lastFromChainId') || 0
  )
  const storedTo = Number(window.localStorage.getItem('hfv:lastToChainId') || 0)

  const [fromChainId, setFromChainId] = useState(
    storedFrom || defaultFrom?.chainId || 1
  )
  const [toChainId, setToChainId] = useState(
    storedTo || defaultTo?.chainId || 56
  )

  const [selectedTokenAddress, setSelectedTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [bridgeLoading, setBridgeLoading] = useState(false)
  const [bridgeResult, setBridgeResult] = useState(null)
  const [error, setError] = useState('')
  const [expandedChains, setExpandedChains] = useState({}) // chainId -> bool

  // live portfolio per chain: balances + usd
  const [chainBalances, setChainBalances] = useState({})
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  // Optional state to store latest gas estimation (ethers fallback)
  const [lastGasInfo, setLastGasInfo] = useState(null)

  // HFV SDK client + bridge
  const client = useMemo(
    () =>
      new HFVClient({
        env: 'mainnet',
        apiBaseUrl: API_BASE
      }),
    []
  )

  const hfvBridge = useMemo(() => new HFVBridge(client), [client])

  const fromChain = chains.find((c) => c.chainId === fromChainId) || null
  const toChain = chains.find((c) => c.chainId === toChainId) || null

  // Persist last used chains
  useEffect(() => {
    window.localStorage.setItem('hfv:lastFromChainId', String(fromChainId))
  }, [fromChainId])

  useEffect(() => {
    window.localStorage.setItem('hfv:lastToChainId', String(toChainId))
  }, [toChainId])

  // Tokens for the current FROM chain (wrapped natives + stables)
  const availableTokens = useMemo(() => {
    if (!fromChain) return []

    const registryEntry = tokenRegistryById[fromChain.chainId] || []
    return registryEntry.filter((t) => {
      return (
        t.isNativeWrapped ||
        t.isStablecoin ||
        ['USDC', 'USDT', 'DAI'].includes(t.symbol)
      )
    })
  }, [fromChain, tokenRegistryById])

  const selectedToken = useMemo(() => {
    if (!fromChain || !selectedTokenAddress) return null
    const registryEntry = tokenRegistryById[fromChain.chainId] || []
    return (
      registryEntry.find(
        (t) => t.address.toLowerCase() === selectedTokenAddress.toLowerCase()
      ) || null
    )
  }, [fromChain, selectedTokenAddress, tokenRegistryById])

  // --------------------------------------------------
  // ethers.js helper: get router for current from-chain
  // --------------------------------------------------
  const getEthersRouter = async () => {
    if (!provider) {
      showToast('error', 'No provider available for ethers.js fallback.')
      return null
    }
    if (!fromChain) {
      showToast('error', 'No source chain selected.')
      return null
    }

    const routerAddress = getRouterAddressForChain(fromChain.chainId)
    if (!routerAddress) {
      showToast(
        'error',
        `No bridge router configured for chainId ${fromChain.chainId}.`
      )
      return null
    }

    const signer = await provider.getSigner()
    return new Contract(routerAddress, HFV_BRIDGE_ABI, signer)
  }

  // --------------------------------------------------
  // Portfolio: on-chain balances + CoinGecko prices
  // --------------------------------------------------
  async function refreshPortfolio() {
    if (!address) {
      showToast('info', 'Connect your wallet to load balances.')
      return
    }

    setPortfolioLoading(true)

    try {
      const chainIds = chains.map((c) => c.chainId)
      const nativePrices = await getMultipleNativePrices(chainIds)

      const balancesMap = {}

      for (const chain of chains) {
        const chainId = chain.chainId
        const rpcUrl = RPC_URLS[chainId]
        if (!rpcUrl) continue

        const rpcProvider = new JsonRpcProvider(rpcUrl)

        // Native balance
        const nativeBalWei = await rpcProvider.getBalance(address)
        const nativeBalance = Number(formatUnits(nativeBalWei, 18))
        const nativePriceUsd = nativePrices[chainId] || 0
        const nativeUsd = nativeBalance * nativePriceUsd

        // Tokens from registry
        const registryEntry = tokenRegistryById[chainId] || []
        const tokenAddresses = registryEntry.map((t) => t.address)
        const tokenPricesUsd = await getTokenUsdPrices(chainId, tokenAddresses)

        const tokenMap = {}

        for (const t of registryEntry) {
          try {
            const tokenContract = new Contract(
              t.address,
              ERC20_ABI,
              rpcProvider
            )
            const rawBal = await tokenContract.balanceOf(address)
            const decimals = t.decimals != null ? t.decimals : 18
            const balance = Number(formatUnits(rawBal, decimals))

            const addrLower = t.address.toLowerCase()
            let priceUsd = tokenPricesUsd[addrLower] || 0

            // Fallbacks if CoinGecko has no price
            if (!priceUsd) {
              if (t.isStablecoin) priceUsd = 1
              else if (t.isNativeWrapped && nativePriceUsd) {
                priceUsd = nativePriceUsd
              }
            }

            tokenMap[addrLower] = {
              balance,
              usd: balance * priceUsd
            }
          } catch (err) {
            console.warn(
              `Failed to read balance for ${t.symbol} on chain ${chainId}:`,
              err
            )
          }
        }

        balancesMap[chainId] = {
          nativeBalance,
          nativeUsd,
          tokens: tokenMap
        }
      }

      setChainBalances(balancesMap)
      showToast('success', 'Portfolio updated (on-chain + CoinGecko).')
    } catch (e) {
      console.error('Portfolio refresh error:', e)
      showToast(
        'error',
        'Could not load balances/prices. Try again in a bit.'
      )
    } finally {
      setPortfolioLoading(false)
    }
  }

  // Auto-refresh portfolio when wallet connects
  useEffect(() => {
    if (address) {
      refreshPortfolio().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  // --------------------------------------------------
  // ethers.js fallback: quote + gas estimation
  // --------------------------------------------------
  async function getQuoteWithEthersFallback() {
    if (!address || !fromChain || !toChain || !selectedToken || !amount) {
      return null
    }

    try {
      const router = await getEthersRouter()
      if (!router) return null

      const decimals = selectedToken.decimals ?? 18
      const parsedAmount = parseUnits(amount, decimals)
      const dstChainParam = BigInt(toChain.chainId)

      const [dstAmount, feeAmount, gasUsd] = await router.quoteBridge(
        selectedToken.address,
        parsedAmount,
        dstChainParam,
        address
      )

      const estimatedOutputAmount = Number(
        formatUnits(dstAmount, decimals)
      )

      // If your router uses 1e18 for fee/gasUsd, adjust here.
      const feeUsd = Number(formatUnits(feeAmount, 18))
      const gasUsdNumber = Number(formatUnits(gasUsd, 18))

      const localQuote = {
        source: 'ethers-fallback',
        estimatedOutputAmount,
        estimatedGasUsd: gasUsdNumber,
        feeUsd
      }

      setQuote(localQuote)
      setError('')
      showToast(
        'success',
        `Quote via on-chain router. Est. gas ≈ ${usd(gasUsdNumber)}.`
      )

      return localQuote
    } catch (err) {
      console.error('ethers.js quoteBridge fallback error:', err)
      showToast(
        'error',
        'On-chain quote via ethers.js failed. Check router ABI/config.'
      )
      return null
    }
  }

  // --------------------------------------------------
  // ethers.js fallback: execute bridge + gas estimate
  // --------------------------------------------------
  async function executeBridgeViaEthersFallback() {
    if (!address || !fromChain || !toChain || !selectedToken || !amount) {
      return null
    }
    if (!provider) {
      showToast('error', 'No provider available for ethers.js bridge.')
      return null
    }

    try {
      const router = await getEthersRouter()
      if (!router) return null

      const decimals = selectedToken.decimals ?? 18
      const parsedAmount = parseUnits(amount, decimals)
      const dstChainParam = BigInt(toChain.chainId)

      let gasCostNative = 0
      let gasCostUsd = 0

      try {
        const gasLimit = await router.estimateGas.bridgeToken(
          selectedToken.address,
          parsedAmount,
          dstChainParam,
          address
        )

        const feeData = await provider.getFeeData()
        const gasPrice = feeData.maxFeePerGas || feeData.gasPrice

        if (gasPrice) {
          const gasCostWei = gasLimit * gasPrice
          gasCostNative = Number(formatUnits(gasCostWei, 18))

          const registryTokens =
            tokenRegistryById[fromChain.chainId] || []
          const wrappedNative =
            registryTokens.find((t) => t.isNativeWrapped) || null
          const nativePriceUsd = wrappedNative?.priceUSD
            ? Number(wrappedNative.priceUSD)
            : 0
          gasCostUsd = gasCostNative * nativePriceUsd

          setLastGasInfo({
            gasLimit: gasLimit.toString(),
            gasPrice: gasPrice.toString(),
            gasCostNative,
            gasCostUsd
          })

          showToast(
            'info',
            `Est. gas cost ≈ ${gasCostNative.toFixed(6)} ${
              fromChain.symbol || ''
            } (${usd(gasCostUsd)}).`
          )
        }
      } catch (gasErr) {
        console.error('ethers.js gas estimation error:', gasErr)
        showToast(
          'error',
          'Could not estimate gas via ethers.js. Proceeding anyway, check wallet.'
        )
      }

      try {
        if (gasCostNative > 0) {
          const nativeBalWei = await provider.getBalance(address)
          const nativeBal = Number(formatUnits(nativeBalWei, 18))
          if (nativeBal < gasCostNative * 1.05) {
            showToast(
              'error',
              `Insufficient native balance for gas. Needed ≈ ${gasCostNative.toFixed(
                6
              )} ${fromChain.symbol || ''}.`
            )
            return null
          }
        }
      } catch (balErr) {
        console.error('ethers.js gas balance check error:', balErr)
      }

      showToast(
        'info',
        'Sending bridge transaction via ethers.js on-chain router…'
      )

      const tx = await router.bridgeToken(
        selectedToken.address,
        parsedAmount,
        dstChainParam,
        address
      )

      const receipt = await tx.wait()

      const fallbackResult = {
        via: 'ethers-fallback',
        trackingId: receipt.transactionHash,
        sourceTxHash: receipt.transactionHash
      }

      setBridgeResult(fallbackResult)

      showToast(
        'success',
        'Bridge tx confirmed via ethers.js. You can track it in your wallet / explorer.'
      )

      return fallbackResult
    } catch (err) {
      console.error('ethers.js bridgeToken fallback error:', err)
      showToast(
        'error',
        'On-chain bridge via ethers.js failed. Check router ABI/config.'
      )
      return null
    }
  }

  // --------------------------------------------------
  // Bridge: quote (HFV SDK first, then ethers)
  // --------------------------------------------------
  async function handleGetQuote() {
    if (!address) {
      setError('Please connect your wallet first.')
      showToast('error', 'Connect your wallet before requesting a quote.')
      return
    }
    if (!fromChain || !toChain || !selectedToken || !amount) {
      setError('Select a source chain, destination chain, token and amount.')
      showToast(
        'error',
        'You must pick from-chain, to-chain, token, and amount first.'
      )
      return
    }
    if (fromChain.chainId === toChain.chainId) {
      setError('Source and destination networks must be different.')
      showToast('error', 'From and To networks must be different.')
      return
    }

    setError('')
    setQuote(null)
    setBridgeResult(null)
    setLastGasInfo(null)
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

      const gasUsdNumber = Number(res.estimatedGasUsd || 0)
      showToast(
        'success',
        `Quote received (HFV SDK). Est. gas ≈ ${usd(gasUsdNumber)}.`
      )
    } catch (e) {
      console.error('Bridge quote error (HFV SDK):', e)
      showToast(
        'error',
        'HFV SDK quote failed. Trying on-chain quote via ethers.js…'
      )

      const fallbackQuote = await getQuoteWithEthersFallback()
      if (!fallbackQuote) {
        setError('Failed to fetch a quote using SDK and ethers fallback.')
      }
    } finally {
      setQuoteLoading(false)
    }
  }

  // --------------------------------------------------
  // Bridge: execute (HFV SDK first, then ethers)
  // --------------------------------------------------
  async function handleExecuteBridge() {
    if (!quote || !fromChain || !toChain || !selectedToken || !amount) return

    setError('')
    setBridgeLoading(true)
    setBridgeResult(null)

    showToast('info', 'Sending bridge transaction from your wallet…')

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
      showToast(
        'success',
        'Bridge transaction submitted via HFV SDK. Track it in your wallet / explorer.'
      )
    } catch (e) {
      console.error('Bridge execute error (HFV SDK):', e)
      showToast(
        'error',
        'HFV SDK bridge failed or was rejected. Trying on-chain bridge via ethers.js…'
      )

      const fallbackResult = await executeBridgeViaEthersFallback()
      if (!fallbackResult) {
        setError(
          'Bridge transaction failed via SDK and ethers fallback. Please check your wallet and config.'
        )
      }
    } finally {
      setBridgeLoading(false)
    }
  }

  function handleFlipChains() {
    setFromChainId(toChainId)
    setToChainId(fromChainId)
    setQuote(null)
    setBridgeResult(null)
    setLastGasInfo(null)
    showToast('info', 'Swapped From/To networks.')
  }

  function toggleChainTokens(chainId) {
    setExpandedChains((prev) => ({
      ...prev,
      [chainId]: !prev[chainId]
    }))
  }

  // sum total portfolio USD (from chainBalances)
  const totalPortfolioUsd = useMemo(() => {
    return Object.values(chainBalances).reduce(
      (sum, c) =>
        sum +
        Number(c.nativeUsd || 0) +
        Object.values(c.tokens || {}).reduce(
          (tSum, t) => tSum + Number(t.usd || 0),
          0
        ),
      0
    )
  }, [chainBalances])

  return (
    <div className="rs-layout">
      <Navbar />

      <div className="dashboard">
        {/* Top label row */}
        <div className="network-dropdown-wrapper">
          <button type="button" className="network-selector" disabled>
            <span>HFV Bridge • Wormhole Powered</span>
          </button>
        </div>

        {/* SMALL SUMMARY ROW (no big stats, just compact info) */}
        <div className="stats-row">
          <div className="stat-box primary">
            <div className="stat-label">Wallet</div>
            <div className="stat-value">
              {address
                ? `${address.slice(0, 6)}…${address.slice(-4)}`
                : 'Not connected'}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">From → To</div>
            <div className="stat-value stat-value--chains">
              {fromChain ? fromChain.name : '—'}{' '}
              <span className="stat-arrow">→</span>{' '}
              {toChain ? toChain.name : '—'}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Portfolio (all chains)</div>
            <div className="stat-value">
              {portfolioLoading ? 'Loading…' : usd(totalPortfolioUsd)}
            </div>
          </div>
        </div>

        {/* BRIDGE HUD CARD */}
        <div className="chain-list">
          <div className="chain-card bridge-card">
            {/* FROM / TO selectors */}
            <div className="chain-card-header bridge-header-row">
              <ChainSelect
                label="From"
                chains={chains}
                value={fromChainId}
                onChange={(id) => {
                  setFromChainId(id)
                  setQuote(null)
                  setBridgeResult(null)
                  setLastGasInfo(null)
                  showToast(
                    'info',
                    `From network set to ${
                      chains.find((c) => c.chainId === id)?.name || 'Network'
                    }.`
                  )
                }}
              />

              <button
                type="button"
                className="btn-secondary bridge-flip"
                onClick={handleFlipChains}
              >
                ⇅
              </button>

              <ChainSelect
                label="To"
                chains={chains}
                value={toChainId}
                onChange={(id) => {
                  setToChainId(id)
                  setQuote(null)
                  setBridgeResult(null)
                  setLastGasInfo(null)
                  showToast(
                    'info',
                    `To network set to ${
                      chains.find((c) => c.chainId === id)?.name || 'Network'
                    }.`
                  )
                }}
              />
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
                      setLastGasInfo(null)
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
                      setLastGasInfo(null)
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

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={refreshPortfolio}
                  disabled={portfolioLoading || !address}
                >
                  {portfolioLoading ? '📊 Updating…' : '📊 Refresh Balances'}
                </button>
              </div>

              {/* Quote summary */}
              {quote && (
                <div className="price-item bridge-quote">
                  <span>
                    Estimated Output
                    {quote.source === 'ethers-fallback' && ' (on-chain)'}
                  </span>
                  <span>
                    {fmt(quote.estimatedOutputAmount)}{' '}
                    {selectedToken ? selectedToken.symbol : ''}
                    {' • '}
                    Gas ≈ {usd(quote.estimatedGasUsd || 0)}
                  </span>
                </div>
              )}

              {/* Extra gas info (ethers fallback) */}
              {lastGasInfo && (
                <div className="price-item bridge-quote">
                  <span>Gas (on-chain estimate)</span>
                  <span>
                    {lastGasInfo.gasCostNative.toFixed(6)}{' '}
                    {fromChain?.symbol || ''} ({usd(lastGasInfo.gasCostUsd)})
                  </span>
                </div>
              )}

              {/* Bridge result / tracking */}
              {bridgeResult && (
                <div className="dust-footer">
                  🌉 Bridge started. Tracking ID:{' '}
                  <code>{bridgeResult.trackingId}</code>
                  {bridgeResult.sourceTxHash && (
                    <>
                      {' • '}
                      <span>Source tx: {bridgeResult.sourceTxHash}</span>
                    </>
                  )}
                  {bridgeResult.via === 'ethers-fallback' && (
                    <>
                      {' • '}
                      <span>Path: ethers.js router</span>
                    </>
                  )}
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

        {/* CHAIN CARDS LIST (TokenRow-style) */}
        <div className="chain-list">
          {chains.map((chain) => {
            const logoSrc = getChainLogo(chain)
            const registryEntry = tokenRegistryById[chain.chainId] || []

            const tokensForCard = registryEntry.filter((t) => {
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

            const chainBalance = chainBalances[chain.chainId]
            const nativeBal = chainBalance?.nativeBalance || 0
            const nativeUsd = chainBalance?.nativeUsd || 0

            return (
              <div key={chain.chainId} className="chain-card">
                <div className="chain-card-header">
                  {/* Left: [ SYMBOL • Name ] pill with logo */}
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
                    {/* Wallet native balance on this chain */}
                    <div className="chain-card-usd">
                      {nativeBal > 0
                        ? `${fmt(nativeBal)} ${
                            chain.symbol || ''
                          } (${usd(nativeUsd)})`
                        : 'Wallet: 0'}
                    </div>
                  </div>

                  {/* Right: quick "Set as From / To" */}
                  <div className="chain-card-native">
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => {
                        setFromChainId(chain.chainId)
                        setQuote(null)
                        setBridgeResult(null)
                        setLastGasInfo(null)
                        showToast(
                          'info',
                          `From network set to ${chain.name || 'Network'}.`
                        )
                      }}
                    >
                      Set as From
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        marginLeft: 6
                      }}
                      onClick={() => {
                        setToChainId(chain.chainId)
                        setQuote(null)
                        setBridgeResult(null)
                        setLastGasInfo(null)
                        showToast(
                          'info',
                          `To network set to ${chain.name || 'Network'}.`
                        )
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
                      const addr = t.address.toLowerCase()
                      const tokenBalInfo =
                        chainBalance?.tokens?.[addr] || undefined

                      const tokenForRow = {
                        ...t,
                        chainId: chain.chainId,
                        balance: tokenBalInfo?.balance ?? 0,
                        value:
                          tokenBalInfo?.usd ??
                          t.value ??
                          t.priceUSD ??
                          0
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

      {/* Floating wallet pill (bottom-right) */}
      {address && (
        <div className="hfv-wallet-pill-floating">
          <span className="hfv-wallet-pill-dot" />
          <span className="hfv-wallet-pill-label">
            Connected as {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`hfv-toast hfv-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}