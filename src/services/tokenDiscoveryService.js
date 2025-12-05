// src/services/tokenDiscoveryService.js
import { ethers } from 'ethers'

// -----------------------------------------------------------------------------
// Chain config
// -----------------------------------------------------------------------------

// Multicall v3 addresses (same contract on many chains)
const MULTICALL3 = {
  1: '0xcA11bde05977b3631167028862bE2a173976CA11', // Ethereum
  10: '0xcA11bde05977b3631167028862bE2a173976CA11', // OP Mainnet
  14: '0xcA11bde05977b3631167028862bE2a173976CA11', // Flare
  40: '0xcA11bde05977b3631167028862bE2a173976CA11', // Telos
  50: '0xcA11bde05977b3631167028862bE2a173976CA11', // XDC
  56: '0xcA11bde05977b3631167028862bE2a173976CA11', // BNB Smart Chain
  57: '0xcA11bde05977b3631167028862bE2a173976CA11', // Syscoin
  61: '0xcA11bde05977b3631167028862bE2a173976CA11', // ETC
  100: '0xcA11bde05977b3631167028862bE2a173976CA11', // Gnosis
  130: '0xcA11bde05977b3631167028862bE2a173976CA11', // Unichain
  137: '0xcA11bde05977b3631167028862bE2a173976CA11', // Polygon PoS
  195: null, // X1 (no standard Multicall3 yet)
  250: '0xcA11bde05977b3631167028862bE2a173976CA11', // Fantom
  42220: '0xcA11bde05977b3631167028862bE2a173976CA11', // Celo
  1284: '0xcA11bde05977b3631167028862bE2a173976CA11', // Moonbeam
  1285: '0xcA11bde05977b3631167028862bE2a173976CA11', // Moonriver
  1329: '0xcA11bde05977b3631167028862bE2a173976CA11', // Sei EVM
  34443: '0xcA11bde05977b3631167028862bE2a173976CA11', // Mode
  42161: '0xcA11bde05977b3631167028862bE2a173976CA11', // Arbitrum One
  43114: '0xcA11bde05977b3631167028862bE2a173976CA11', // Avalanche C
  5000: '0xcA11bde05977b3631167028862bE2a173976CA11', // Mantle
  57073: '0xcA11bde05977b3631167028862bE2a173976CA11', // Inkonchain
  59144: '0xcA11bde05977b3631167028862bE2a173976CA11', // Linea
  7777777: '0xcA11bde05977b3631167028862bE2a173976CA11', // Zora
  80094: '0xcA11bde05977b3631167028862bE2a173976CA11', // Berachain Bartio
  8453: '0xcA11bde05977b3631167028862bE2a173976CA11', // Base
  9745: '0xcA11bde05977b3631167028862bE2a173976CA11', // Plasma
  1313161554: '0xcA11bde05977b3631167028862bE2a173976CA11' // Aurora
}

// Public RPCs per chain, with env overrides (you can tighten these later)
const RPC_URLS = {
  1: import.meta.env.VITE_RPC_1 || 'https://eth.llamarpc.com',
  10: import.meta.env.VITE_RPC_10 || 'https://optimism.llamarpc.com',
  14: import.meta.env.VITE_RPC_14 || 'https://flare-api.flare.network/ext/C/rpc',
  40: import.meta.env.VITE_RPC_40 || 'https://mainnet.telos.net/evm',
  50: import.meta.env.VITE_RPC_50 || 'https://rpc.xinfin.network',
  56: import.meta.env.VITE_RPC_56 || 'https://bsc-dataseed.binance.org',
  57: import.meta.env.VITE_RPC_57 || 'https://rpc.syscoin.org',
  61: import.meta.env.VITE_RPC_61 || 'https://etc.rivet.link',
  100: import.meta.env.VITE_RPC_100 || 'https://rpc.gnosis.gateway.fm',
  130: import.meta.env.VITE_RPC_130 || 'https://rpc.unichain.org',
  137: import.meta.env.VITE_RPC_137 || 'https://polygon.llamarpc.com',
  195: import.meta.env.VITE_RPC_195 || '',
  250: import.meta.env.VITE_RPC_250 || 'https://rpc.fantom.network',
  42220: import.meta.env.VITE_RPC_42220 || 'https://forno.celo.org',
  1284: import.meta.env.VITE_RPC_1284 || 'https://rpc.api.moonbeam.network',
  1285: import.meta.env.VITE_RPC_1285 || 'https://rpc.api.moonriver.moonbeam.network',
  1329: import.meta.env.VITE_RPC_1329 || 'https://evm-rpc.sei-apis.com',
  34443: import.meta.env.VITE_RPC_34443 || 'https://mainnet.mode.network',
  42161: import.meta.env.VITE_RPC_42161 || 'https://arb1.arbitrum.io/rpc',
  43114: import.meta.env.VITE_RPC_43114 || 'https://api.avax.network/ext/bc/C/rpc',
  5000: import.meta.env.VITE_RPC_5000 || 'https://rpc.mantle.xyz',
  57073: import.meta.env.VITE_RPC_57073 || 'https://rpc.inkonchain.com',
  59144: import.meta.env.VITE_RPC_59144 || 'https://rpc.linea.build',
  7777777: import.meta.env.VITE_RPC_7777777 || 'https://rpc.zora.energy',
  80094: import.meta.env.VITE_RPC_80094 || 'https://bartio.rpc.berachain.com',
  8453: import.meta.env.VITE_RPC_8453 || 'https://mainnet.base.org',
  9745: import.meta.env.VITE_RPC_9745 || 'https://rpc.plasma.xyz',
  1313161554:
    import.meta.env.VITE_RPC_1313161554 || 'https://mainnet.aurora.dev'
}

// Native token metadata per chain
const NATIVE_TOKEN = {
  1: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  10: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  14: { symbol: 'FLR', decimals: 18, name: 'Flare' },
  40: { symbol: 'TLOS', decimals: 18, name: 'Telos' },
  50: { symbol: 'XDC', decimals: 18, name: 'XDC Network' },
  56: { symbol: 'BNB', decimals: 18, name: 'BNB' },
  57: { symbol: 'SYS', decimals: 18, name: 'Syscoin' },
  61: { symbol: 'ETC', decimals: 18, name: 'Ethereum Classic' },
  100: { symbol: 'xDAI', decimals: 18, name: 'Gnosis' },
  130: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  137: { symbol: 'MATIC', decimals: 18, name: 'Polygon' },
  195: { symbol: 'X1', decimals: 18, name: 'X1' },
  250: { symbol: 'FTM', decimals: 18, name: 'Fantom' },
  42220: { symbol: 'CELO', decimals: 18, name: 'Celo' },
  1284: { symbol: 'GLMR', decimals: 18, name: 'Moonbeam' },
  1285: { symbol: 'MOVR', decimals: 18, name: 'Moonriver' },
  1329: { symbol: 'SEI', decimals: 18, name: 'Sei' },
  34443: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  42161: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  43114: { symbol: 'AVAX', decimals: 18, name: 'Avalanche' },
  5000: { symbol: 'MNT', decimals: 18, name: 'Mantle' },
  57073: { symbol: 'INK', decimals: 18, name: 'Inkonchain' },
  59144: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  7777777: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  80094: { symbol: 'BERA', decimals: 18, name: 'Berachain' },
  8453: { symbol: 'ETH', decimals: 18, name: 'Ether' },
  9745: { symbol: 'PLASMA', decimals: 18, name: 'Plasma' },
  1313161554: { symbol: 'ETH', decimals: 18, name: 'Ether' }
}

// Covalent chain slugs
const COVALENT_CHAIN = {
  1: 'eth-mainnet',
  10: 'optimism-mainnet',
  56: 'bsc-mainnet',
  100: 'gnosis-mainnet',
  137: 'polygon-mainnet',
  250: 'fantom-mainnet',
  42161: 'arbitrum-mainnet',
  43114: 'avalanche-mainnet',
  8453: 'base-mainnet',
  34443: 'mode-mainnet',
  59144: 'linea-mainnet',
  7777777: 'zora-mainnet',
  // experimental / may be unsupported in free tier:
  195: 'x1-mainnet',
  1329: 'sei-mainnet',
  80094: 'berachain-bartio'
}

// -----------------------------------------------------------------------------
// Tokenlist sources
// -----------------------------------------------------------------------------

const TOKENLIST_SOURCES = {
  1: [
    'https://tokens.uniswap.org',
    'https://api.1inch.io/v5.0/1/tokens'
  ],
  10: ['https://api.1inch.io/v5.0/10/tokens'],
  56: ['https://api.1inch.io/v5.0/56/tokens'],
  100: ['https://tokens.coingecko.com/xdai/all.json'],
  137: ['https://api.1inch.io/v5.0/137/tokens'],
  250: ['https://tokens.coingecko.com/fantom/all.json'],
  34443: [
    'https://raw.githubusercontent.com/mode-network/asset-list/main/list.json'
  ],
  42161: ['https://api.1inch.io/v5.0/42161/tokens'],
  43114: ['https://tokens.coingecko.com/avalanche/all.json'],
  8453: ['https://api.1inch.io/v5.0/8453/tokens'],
  59144: [
    'https://raw.githubusercontent.com/Consensys/linea-token-list/main/build/linea-mainnet.json'
  ],
  7777777: [
    'https://raw.githubusercontent.com/zora-community/token-list/main/zora.tokenlist.json'
  ],
  80094: [
    'https://raw.githubusercontent.com/Berachain/token-list/main/bera.tokenlist.json'
  ],
  130: [
    'https://raw.githubusercontent.com/unichain/token-list/main/unichain.tokenlist.json'
  ],
  42220: ['https://tokens.coingecko.com/celo/all.json'],
  1313161554: [
    'https://raw.githubusercontent.com/aurora-is-near/bridge-assets/master/aurora.tokenlist.json'
  ],
  1284: [
    'https://raw.githubusercontent.com/moonbeam-foundation/moonbeam-token-list/main/tokens/moonbeam.json'
  ],
  1285: [
    'https://raw.githubusercontent.com/moonbeam-foundation/moonbeam-token-list/main/tokens/moonriver.json'
  ],
  5000: [
    'https://raw.githubusercontent.com/mantlenetworkio/mantle-token-list/main/mantle.tokenlist.json'
  ],
  1329: [
    'https://raw.githubusercontent.com/sei-protocol/token-list/main/sei.tokenlist.json'
  ],
  9745: [
    'https://raw.githubusercontent.com/plasma-network/token-list/main/plasma.tokenlist.json'
  ],
  14: [
    'https://raw.githubusercontent.com/flare-labs/token-list/main/flare.tokenlist.json'
  ]
}

// -----------------------------------------------------------------------------
// ERC-20 ABI + helpers
// -----------------------------------------------------------------------------

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
]

// tiny in-memory cache: { `${chainId}:${address}`: { ts, data } }
const BALANCE_CACHE = new Map()
const CACHE_TTL_MS = 60_000 // 1 minute

function cacheGet(key) {
  const entry = BALANCE_CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    BALANCE_CACHE.delete(key)
    return null
  }
  return entry.data
}

function cacheSet(key, data) {
  BALANCE_CACHE.set(key, { ts: Date.now(), data })
}

// safe fetch JSON
async function fetchJson(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

function getProvider(chainId) {
  const url = RPC_URLS[Number(chainId)]
  if (!url) return null
  return new ethers.JsonRpcProvider(url)
}

// normalize several tokenlist formats into a flat [{ address, symbol, decimals, chainId }]
function normalizeTokenList(chainId, raw) {
  const out = []
  if (!raw) return out

  // 1inch: { tokens: { 0x..: { symbol, decimals, ... } } }
  if (raw.tokens && !Array.isArray(raw.tokens)) {
    for (const [addr, t] of Object.entries(raw.tokens)) {
      out.push({
        address: addr,
        symbol: t.symbol,
        decimals: t.decimals ?? 18
      })
    }
  } else if (Array.isArray(raw.tokens)) {
    // Standard tokenlist: { tokens: [ ... ] }
    for (const t of raw.tokens) {
      if (!t?.address) continue
      out.push({
        address: t.address,
        symbol: t.symbol || '',
        decimals: t.decimals ?? 18
      })
    }
  } else if (Array.isArray(raw)) {
    // raw array
    for (const t of raw) {
      if (!t?.address) continue
      out.push({
        address: t.address,
        symbol: t.symbol || '',
        decimals: t.decimals ?? 18
      })
    }
  }

  // dedupe by lowercased address
  const seen = new Set()
  return out
    .filter((t) => {
      const k = t.address.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .map((t) => ({ ...t, chainId: Number(chainId) }))
}

async function loadTokenListForChain(chainId) {
  const urls = TOKENLIST_SOURCES[Number(chainId)] || []
  const merged = []
  for (const url of urls) {
    try {
      const json = await fetchJson(url)
      merged.push(...normalizeTokenList(chainId, json))
    } catch (e) {
      console.warn('Tokenlist fetch failed', chainId, url, e?.message || e)
    }
  }
  return merged
}

// -----------------------------------------------------------------------------
// Multicall-based ERC-20 balance sweep
// -----------------------------------------------------------------------------

async function multicallBalances(provider, chainId, owner, tokens) {
  const mcAddr = MULTICALL3[Number(chainId)]
  if (!mcAddr) return []

  const ercIface = new ethers.Interface(ERC20_ABI)
  const mcIface = new ethers.Interface([
    'function aggregate((address target, bytes callData)[]) public returns (uint256 blockNumber, bytes[] returnData)'
  ])

  const calls = tokens.map((t) => ({
    target: t.address,
    callData: ercIface.encodeFunctionData('balanceOf', [owner])
  }))

  const CHUNK = 200
  const results = []

  for (let i = 0; i < calls.length; i += CHUNK) {
    const slice = calls.slice(i, i + CHUNK)
    try {
      const data = await provider.call({
        to: mcAddr,
        data: mcIface.encodeFunctionData('aggregate', [slice])
      })
      const decoded = mcIface.decodeFunctionResult('aggregate', data)
      const returnData = decoded[1] // bytes[]

      for (let j = 0; j < returnData.length; j++) {
        const raw = returnData[j]
        const [bal] = ethers.AbiCoder.defaultAbiCoder().decode(
          ['uint256'],
          raw
        )
        if (bal > 0n) {
          const tok = tokens[i + j]
          results.push({
            chainId: Number(chainId),
            address: tok.address,
            symbol: tok.symbol,
            decimals: tok.decimals ?? 18,
            balance: bal.toString(),
            isNative: false,
            source: 'multicall'
          })
        }
      }
    } catch (e) {
      console.warn(
        'multicallBalances chunk failed',
        chainId,
        e?.message || e
      )
    }
  }

  return results
}

// -----------------------------------------------------------------------------
// Covalent indexer fallback
// -----------------------------------------------------------------------------

async function covalentBalances(chainId, address, apiKey) {
  const chainSlug = COVALENT_CHAIN[Number(chainId)]
  if (!chainSlug || !apiKey) return []

  const url = `https://api.covalenthq.com/v1/${chainSlug}/address/${address}/balances_v2/?nft=false&no-spam=true&key=${apiKey}`

  try {
    const json = await fetchJson(url)
    const items = json?.data?.items || []

    return items
      .filter(
        (i) =>
          i.type === 'cryptocurrency' &&
          i.contract_decimals != null &&
          i.contract_address
      )
      .map((i) => ({
        chainId: Number(chainId),
        address: i.contract_address,
        symbol: i.contract_ticker_symbol || '',
        name: i.contract_name || '',
        decimals: i.contract_decimals ?? 18,
        balance: i.balance || '0',
        usd: i.quote || 0,
        isNative: false,
        source: 'covalent'
      }))
  } catch (e) {
    console.warn(
      'covalentBalances failed',
      chainId,
      e?.message || String(e)
    )
    return []
  }
}

// -----------------------------------------------------------------------------
// Native token balance
// -----------------------------------------------------------------------------

async function nativeBalance(provider, chainId, owner) {
  try {
    const meta = NATIVE_TOKEN[Number(chainId)]
    if (!meta) return null
    const bal = await provider.getBalance(owner)
    return {
      chainId: Number(chainId),
      address: '0x0000000000000000000000000000000000000000',
      symbol: meta.symbol,
      name: meta.name,
      decimals: meta.decimals,
      balance: bal.toString(),
      usd: 0, // can be filled later by price service
      isNative: true,
      source: 'native'
    }
  } catch (e) {
    console.warn(
      'nativeBalance failed',
      chainId,
      e?.message || String(e)
    )
    return null
  }
}

// -----------------------------------------------------------------------------
// PUBLIC: discover all tokens on a single chain
// -----------------------------------------------------------------------------

/**
 * Zerion-style discovery for one chain:
 * - native token
 * - ERC-20s from tokenlists via Multicall
 * - ERC-20s from Covalent (indexer)
 *
 * Returns: Array of normalized token balances.
 */
export async function discoverAllERC20s({
  chainId,
  owner,
  mode = 'hybrid' // 'hybrid' | 'indexer-only' | 'onchain-only'
}) {
  if (!owner) return []

  const key = `${chainId}:${owner.toLowerCase()}`
  const cached = cacheGet(key)
  if (cached) return cached

  const provider = getProvider(chainId)
  const apiKey = import.meta.env.VITE_COVALENT_KEY || ''

  const out = []

  // 1) Native
  if (provider) {
    const nat = await nativeBalance(provider, chainId, owner)
    if (nat) out.push(nat)
  }

  let onchainTokens = []
  let indexerTokens = []

  // 2) On-chain via Multicall + tokenlists
  if (mode !== 'indexer-only' && provider) {
    const tokenlist = await loadTokenListForChain(chainId)
    if (tokenlist.length) {
      onchainTokens = await multicallBalances(
        provider,
        chainId,
        owner,
        tokenlist
      )
    }
  }

  // 3) Covalent indexer
  if (mode !== 'onchain-only') {
    const cov = await covalentBalances(chainId, owner, apiKey)
    indexerTokens = cov
  }

  // 4) Merge ERC-20s: prefer Covalent metadata if available, but keep Multicall
  const byAddr = new Map()

  for (const t of onchainTokens) {
    byAddr.set(t.address.toLowerCase(), t)
  }

  for (const t of indexerTokens) {
    const k = t.address.toLowerCase()
    if (!byAddr.has(k)) {
      byAddr.set(k, t)
    } else {
      // merge balances: Covalent usually more precise / complete
      const base = byAddr.get(k)
      byAddr.set(k, {
        ...base,
        ...t, // override symbol/decimals/name/usd
        balance: t.balance || base.balance,
        source: 'hybrid'
      })
    }
  }

  const erc20s = Array.from(byAddr.values())

  const final = [...out, ...erc20s]

  cacheSet(key, final)
  return final
}

/**
 * Discover across multiple chains and return:
 * {
 * byChain: { [chainId]: TokenBalance[] },
 * all: TokenBalance[],
 * totalUsd: number
 * }
 *
 * Note: USD will only be non-zero where Covalent returned quote values.
 */
export async function discoverPortfolio({
  owner,
  chainIds,
  mode = 'hybrid'
}) {
  if (!owner || !Array.isArray(chainIds) || !chainIds.length) {
    return { byChain: {}, all: [], totalUsd: 0 }
  }

  const byChain = {}
  const all = []

  for (const cid of chainIds) {
    try {
      const tokens = await discoverAllERC20s({
        chainId: cid,
        owner,
        mode
      })
      byChain[cid] = tokens
      all.push(...tokens)
    } catch (e) {
      console.warn(
        'discoverPortfolio chain failed',
        cid,
        e?.message || String(e)
      )
      byChain[cid] = []
    }
  }

  const totalUsd = all.reduce(
    (sum, t) => sum + (typeof t.usd === 'number' ? t.usd : 0),
    0
  )

  return { byChain, all, totalUsd }
}