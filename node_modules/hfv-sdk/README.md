HFV SDK

Bridge Quotes • Token Prices • Chain Metadata • Token Registry

The HFV SDK is a lightweight, production-ready JavaScript/TypeScript package that provides:

🟢 Cross-chain bridge quotes

🟢 Native token prices

🟢 ERC-20 token prices

🟢 Chain metadata utilities

🟢 Token registry across all supported chains


This SDK is designed for HFV Protocol, DApps, aggregators, dashboards, and backend services that need a fast unified interface for chain + token + bridging operations.


---

📦 Installation

npm install hfv-sdk

OR

yarn add hfv-sdk


---

🧩 Importing the SDK

ESM

import { HFVBridge, HFVPrices, SUPPORTED_CHAINS } from 'hfv-sdk'

CommonJS

const { HFVBridge, HFVPrices, SUPPORTED_CHAINS } = require('hfv-sdk')


---

📈 Features

✔️ Token Registry

Full registry for all chains + wrapped & native tokens, auto-generated from Li.Fi + extended with HFV metadata.

✔️ Bridge Routing

Get bridge quotes, execute transactions, and track status.

✔️ Price Oracle

Native gas token prices

ERC-20 token prices (Coingecko + Debank + cross-checks)


✔️ Chain Utilities

Get chain by ID

Get chain by key

Get all supported chains

Filter Wormhole-supported chains



---

🌐 Usage Examples

1. Get Native Token Price

import { HFVPrices } from 'hfv-sdk'

const price = await HFVPrices.getNativePrice(1) // Ethereum
console.log(price) // { usd: 2345.12 }


---

2. Get ERC-20 Token Prices

const prices = await HFVPrices.getTokenPrices({
  chainId: 1,
  addresses: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'] // USDC
})

console.log(prices)


---

3. Bridge Quote

import { HFVBridge } from 'hfv-sdk'

const quote = await HFVBridge.getQuote({
  fromChain: 'Ethereum',
  toChain: 'Base',
  token: 'ETH',
  amount: '0.01',
  recipient: '0x1234...abcd'
})

console.log(quote)


---

4. Execute Bridge Transaction

const exec = await HFVBridge.execute({
  ...quote,
  quoteId: quote.quoteId
})

console.log(exec)


---

5. Track Bridge Status

const status = await HFVBridge.getStatus(exec.trackingId)

console.log(status)
/*
{
  status: 'pending' | 'completed' | 'failed',
  fromChain: 'Ethereum'
}
*/


---

🗂 File Structure

hfv-sdk/
 ├── src/
 │ ├── chains/
 │ ├── tokens/
 │ ├── prices/
 │ ├── bridge/
 │ └── index.ts
 ├── dist/
 ├── data/
 │ └── tokens-allchains.json
 ├── api/ (optional express API)
 ├── package.json
 └── README.md


---

📡 Optional: Use the Built-In Express API

Your repository includes a full HTTP API (used in Codespaces):

Routes

Route Method Description

/api/prices/native?chainId= GET Native gas price
/api/prices/tokens POST Prices for ERC-20 tokens
/api/bridge/quote POST Fetch bridge quote
/api/bridge/execute POST Execute bridge tx
/api/bridge/status?id= GET Track bridge status


To run:

node api/index.js


---

📌 Supported Chains

✔ Ethereum
✔ Base
✔ Arbitrum
✔ BSC
✔ Polygon
✔ Avalanche
✔ Fantom
✔ zkSync
✔ Linea
✔ Scroll
✔ Optimism
✔ And 30+ more…

Completely generated from tokens-allchains.json.


---

🔐 Environment Variables (optional)

You can create .env if needed:

PORT=4000
COINGECKO_API_KEY=your_key


---

🛠 Development

Build:

npm run build

Watch:

npm run dev

Clean:

npm run clean


---

📤 Publishing (for maintainers)

npm version patch
npm publish


---

📜 License

MIT © HFV Protocol


---

🚀 HFV Protocol

Website: https://hfvprotocol.org

X / Twitter: https://twitter.com/hfvprotocol

Discord: https://discord.gg/Be4mQEFN

Email: admin@infohfvprotocol.org 