# Local Development Guide — Run Everything on Your Machine

> Play the full game locally without spending any ETH. Uses Anvil (Foundry's local blockchain) + MetaMask + the React frontend.

---

## Why Run Locally?

| Benefit | Description |
|---|---|
| **Zero cost** | Anvil gives you 10,000 fake ETH per account |
| **Instant** | No block time — transactions confirm immediately |
| **Private** | No public testnet — everything stays on your computer |
| **Debuggable** | Anvil shows every transaction and event in the terminal |

---

## Prerequisites

| Tool | Check | Install if missing |
|---|---|---|
| Foundry (forge, anvil, cast) | `forge --version` | `curl -L https://foundry.paradigm.xyz \| bash` then `foundryup` |
| Node.js 18+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| MetaMask | Browser extension | [metamask.io](https://metamask.io/) |

---

## Architecture (Local)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Browser    │────▶│  MetaMask    │────▶│  Anvil (localhost)  │
│  (frontend) │     │  (wallet)    │     │  :8545              │
└─────────────┘     └──────────────┘     └─────────────────────┘
                           │                         │
                           │    Signs transactions   │
                           │◄────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  3 Contracts    │
                  │  ChessPass      │
                  │  ChineseChess   │
                  │  ChessLobby     │
                  └─────────────────┘
```

---

## Step 1: Start Local Blockchain

Open a terminal and run:

```bash
anvil
```

**Leave this running.** You will see:
- 10 test accounts
- 10 private keys
- 10,000 ETH per account
- Chain ID: `31337`

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
...
```

---

## Step 2: Deploy Contracts to Localhost

Open a **second terminal**:

```bash
cd contracts

forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  -vvvv
```

**What this does:**
- Uses Anvil's first default account to deploy
- Sends 5 transactions to your local node
- Costs **zero real ETH**

**Save the 3 printed addresses:**

```
== Logs ==
  ChessPass    : 0x5FbDB2315678afecb367f032d93F642f64180aa3
  ChineseChess : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  ChessLobby   : 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

> Your addresses will likely match these exactly because Anvil produces deterministic deployments with the same private key and nonce.

---

## Step 3: Add Localhost to wagmi Config

Edit `frontend/src/wagmi.config.ts`:

```ts
import { createConfig, http } from 'wagmi'
import { arbitrum, arbitrumSepolia, hardhat } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [arbitrum, arbitrumSepolia, hardhat],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Chinese Chess' }),
  ],
  transports: {
    [arbitrum.id]:        http(import.meta.env.VITE_ARBITRUM_RPC         || 'https://arb1.arbitrum.io/rpc'),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'),
    [hardhat.id]:         http('http://localhost:8545'),
  },
})
```

**What changed:**
- Added `hardhat` chain import
- Added `hardhat` to the `chains` array
- Added `http('http://localhost:8545')` transport for chain ID 31337

---

## Step 4: Wire Frontend to Local Contracts

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your **local** deployed addresses:

```env
VITE_CHESS_PASS_ADDRESS=0xYOUR_LOCAL_CHESS_PASS_ADDRESS
VITE_CHESS_LOBBY_ADDRESS=0xYOUR_LOCAL_CHESS_LOBBY_ADDRESS
VITE_CHINESE_CHESS_ADDRESS=0xYOUR_LOCAL_CHINESE_CHESS_ADDRESS

VITE_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
VITE_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

---

## Step 5: Add Localhost Network to MetaMask

1. Open MetaMask → click your **account icon** → **Settings**
2. Go to **Networks** → **Add a network** → **Add a network manually**
3. Fill in:

| Field | Value |
|---|---|
| Network name | `Anvil Local` |
| New RPC URL | `http://localhost:8545` |
| Chain ID | `31337` |
| Currency symbol | `ETH` |

4. Click **Save** and switch to **Anvil Local**

---

## Step 6: Import a Test Account

1. In MetaMask, click the **account icon** → **Import account**
2. Select type **Private Key**
3. Paste:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
4. Click **Import**

You will see account `0xf39F...2266` with **10,000 ETH**.

> ⚠️ **This is a public test key.** Never use it on mainnet or any real network.

---

## Step 7: Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Step 8: Play a Full Game (Two Wallets)

### Wallet A (Normal Browser Tab)
1. Connect MetaMask → make sure you're on **Anvil Local**
2. Go to **Mint** → click **Mint Pass** (costs fake 0.01 ETH)
3. Go to **Lobby** → **Create Game** (set wager to `0` for a free game)

### Wallet B (Incognito / Second Browser)
1. Install MetaMask (or use a different browser profile)
2. Add the **Anvil Local** network (Step 5)
3. Import the **second** test account:
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
4. Mint a pass from this wallet
5. Go to **Lobby** → click **Join** on the game listed by Wallet A
6. The page should redirect to `/game/:gameId`

### Play
- **Wallet A** (Red) makes the first move
- **Wallet B** (Black) responds
- Continue until checkmate, resign, or timeout

### Optional: Enable Auto Moves

By default, every move is an on-chain transaction, so MetaMask asks for confirmation each turn.

To reduce confirmations while keeping moves on-chain:

1. Open the game page with the player wallet.
2. Click **Enable Auto Moves**.
3. Confirm the session-key authorization in MetaMask.
4. Confirm the small local gas transfer to the temporary key.
5. Move pieces normally.

After this, normal moves are sent by the temporary session key and should not open MetaMask each turn.

The session key is intentionally narrow:

| Permission | Allowed? |
|---|---|
| Submit moves for this `gameId` | Yes |
| Submit moves for another game | No |
| Resign | No |
| Claim timeout | No |
| Withdraw funds | No |
| Mint passes | No |
| Use after expiry | No |

Use **Revoke** on the game page to disable the active session key.

---

## Anvil Default Test Accounts

| # | Address | Private Key |
|---|---|---|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

All accounts start with **10,000 ETH**.

---

## Useful Anvil Commands

```bash
# Start fresh (resets all state)
anvil

# Start with a specific fork (copies real chain state at latest block)
anvil --fork-url https://arb1.arbitrum.io/rpc

# Start with a specific block number
anvil --fork-url https://arb1.arbitrum.io/rpc --fork-block-number 250000000

# Auto-mine a block every 5 seconds (instead of instant)
anvil --block-time 5
```

---

## Useful Cast Commands (Interact from Terminal)

```bash
# Read the board of game 0
cast call 0xYOUR_CHINESE_CHESS_ADDRESS "getBoard(uint256)" 0 \
  --rpc-url http://localhost:8545

# Read game info
cast call 0xYOUR_CHINESE_CHESS_ADDRESS "getGame(uint256)" 0 \
  --rpc-url http://localhost:8545

# Check if an address has a pass
cast call 0xYOUR_CHESS_PASS_ADDRESS "hasPass(address)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545

# Send a move directly from terminal (example: move piece from pos 82 to pos 72 in game 0)
cast send 0xYOUR_CHINESE_CHESS_ADDRESS "submitMove(uint256,uint8,uint8)" 0 82 72 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `forge: command not found` | PATH not set | `export PATH="$HOME/.foundry/bin:$PATH"` or restart terminal |
| MetaMask shows wrong balance | Connected to wrong network | Switch to **Anvil Local** (Chain ID 31337) |
| `Error: could not detect network` | Anvil not running | Start `anvil` in another terminal |
| Frontend shows "Wrong network" | wagmi doesn't know localhost | Make sure you added `hardhat` chain to `wagmi.config.ts` |
| Cannot mint pass | Wrong contract address | Double-check `.env` has the **local** addresses from deploy |
| Join button does nothing | Wallet B has no pass | Wallet B must mint a pass first |

---

## From Local to Testnet

Once you've tested everything locally and you're confident it works:

1. Stop Anvil
2. Follow [TESTNET_DEPLOYMENT.md](TESTNET_DEPLOYMENT.md) to deploy to **Arbitrum Sepolia**
3. Remove `hardhat` from `wagmi.config.ts` (optional)
4. Update `frontend/.env` with the **real Sepolia addresses**
5. Switch MetaMask to **Arbitrum Sepolia**
6. Get Sepolia ETH from a faucet
7. Test again on the real testnet

---

*Document version: 1.0 | Local chain: Anvil (31337) | Last updated: 2026-05-24*
