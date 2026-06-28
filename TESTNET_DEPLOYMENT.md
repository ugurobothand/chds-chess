# Testnet Deployment Guide — Arbitrum Sepolia

> Step-by-step instructions to deploy chds-chess contracts to Arbitrum Sepolia testnet and run the frontend locally for end-to-end testing.

---

## Prerequisites

| Requirement | How to get it |
|---|---|
| Foundry installed | `curl -L https://foundry.paradigm.xyz \| bash` then `foundryup` |
| Node.js 18+ | [nodejs.org](https://nodejs.org/) (v20+ recommended) |
| Wallet with Sepolia ETH | Faucet links below |
| MetaMask (or similar) | [metamask.io](https://metamask.io/) |

---

## Step 1: Get Arbitrum Sepolia ETH

You need ~0.001 ETH on Arbitrum Sepolia to deploy all 3 contracts.

| Faucet | URL |
|---|---|
| Alchemy | [sepoliafaucet.com](https://www.sepoliafaucet.com/) |
| Infura | [infura.io/faucet/sepolia](https://www.infura.io/faucet/sepolia) |
| QuickNode | [faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia) |

> **Tip:** Make sure your wallet is switched to **Arbitrum Sepolia** (Chain ID: `421614`), not Ethereum Sepolia.

---

## Step 2: Configure Environment Variables

In the **project root**, copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Arbitrum Sepolia RPC — public endpoint works fine for deploy
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Your deployer wallet private key (with testnet ETH)
# NEVER share this. NEVER commit it to git.
PRIVATE_KEY=0x...

# Optional — only needed for contract verification on Arbiscan Sepolia
ARBISCAN_API_KEY=your_key_here
```

> `.env` is already in `.gitignore` and will not be committed.

---

## Step 3: Deploy Contracts

Run this from the **project root**:

```bash
cd contracts
source ~/.bashrc
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_RPC_URL \
  --broadcast \
  -vvvv
```

**What happens:**
1. `ChessPass` deploys — ERC-721 soulbound NFT
2. `ChineseChess` deploys — on-chain game engine
3. `ChessLobby` deploys — matchmaking + ETH escrow
4. `ChessLobby.setChineseChess()` links the game contract
5. `ChineseChess.setLobby()` links the lobby contract

**Expected output:**

```
== Logs ==
  ChessPass    : 0xYOUR_CHESS_PASS_ADDRESS
  ChineseChess : 0xYOUR_CHINESE_CHESS_ADDRESS
  ChessLobby   : 0xYOUR_CHESS_LOBBY_ADDRESS
```

**Copy these 3 addresses.** You need them in the next step.

**Estimated gas cost:** ~0.00019 ETH (very cheap on Arbitrum).

---

## Step 4: Wire the Frontend

In the `frontend/` directory, copy the example env file:

```bash
cd frontend
cp .env.example .env
```

Fill in **your** deployed addresses:

```env
# ─── Contract Addresses ───────────────────────────────────────────────────────
VITE_CHESS_PASS_ADDRESS=0xYOUR_CHESS_PASS_ADDRESS
VITE_CHESS_LOBBY_ADDRESS=0xYOUR_CHESS_LOBBY_ADDRESS
VITE_CHINESE_CHESS_ADDRESS=0xYOUR_CHINESE_CHESS_ADDRESS

# ─── RPC URLs ─────────────────────────────────────────────────────────────────
VITE_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
VITE_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Block number when ChineseChess was deployed (from deploy output).
# Helps the leaderboard avoid scanning from block 0.
VITE_CONTRACT_DEPLOY_BLOCK=0
```

> Replace `VITE_CONTRACT_DEPLOY_BLOCK=0` with the actual deployment block number if you want the leaderboard to load faster.

---

## Step 5: Install & Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Step 6: Test End-to-End

Use **two different wallets** (e.g., normal browser + incognito) to test a full game flow.

| Step | Wallet A | Wallet B |
|---|---|---|
| 1 | Connect MetaMask → switch to **Arbitrum Sepolia** | Same |
| 2 | Mint Chess Pass (0.01 Sepolia ETH) | Mint Chess Pass |
| 3 | Go to **Lobby** → **Create Game** (set wager or free) | — |
| 4 | — | Click **Join** on the listed game |
| 5 | Make a move | Make a move |
| 6 | Test **Resign** or **Claim Timeout** | — |

**Verify:**
- [ ] Mint succeeds and pass appears in MetaMask NFT tab
- [ ] Game lobby shows open games
- [ ] Joining a game redirects to `/game/:gameId`
- [ ] Board renders with all pieces
- [ ] Moves submit and confirm on-chain
- [ ] Winner gets ETH payout (if wager > 0)
- [ ] Win/loss record updates in Profile
- [ ] Leaderboard populates after a game finishes

---

## Optional: Verify Contracts on Arbiscan

If you want the source code visible on [sepolia.arbiscan.io](https://sepolia.arbiscan.io/):

Add this to `contracts/foundry.toml` under `[etherscan]`:

```toml
sepolia = { key = "${ARBISCAN_API_KEY}", url = "https://api-sepolia.arbiscan.io/api" }
```

Then deploy with the `--verify` flag:

```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY \
  -vvvv
```

> Verification is optional for testnet but strongly recommended for mainnet.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `forge: command not found` | Foundry not in PATH | Run `source ~/.bashrc` or restart terminal |
| `EvmError: Revert` | Wallet has no Sepolia ETH | Get ETH from a faucet (Step 1) |
| `CompilerError: Source not found` | `lib/` missing | Run `forge install` in `contracts/` |
| `npm run dev` fails / hangs | Node.js too old | Upgrade to Node.js v20+ |
| MetaMask shows wrong network | On Ethereum Mainnet | Switch to **Arbitrum Sepolia** in MetaMask |
| `WrongWagerAmount` when joining | ETH sent does not match listing | Join button auto-sends correct amount — do not edit |

---

## Next Steps After Testnet

Once you've played 10+ complete games and fixed any bugs:

1. **Deploy to Arbitrum One mainnet** — same command, just switch RPC to mainnet
2. **Set NFT artwork** — design image, upload metadata to IPFS, call `ChessPass.setBaseURI()`
3. **Build & deploy frontend** — `npm run build`, then pin `dist/` to IPFS
4. **Security audit** — recommended if real ETH wagers will be used
5. **Register ENS** — e.g., `chinesechess.eth` pointing to your IPFS hash

---

*Document version: 1.0 | Chain: Arbitrum Sepolia (421614) | Last updated: 2026-05-24*
