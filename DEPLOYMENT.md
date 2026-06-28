# chds-chess Deployment Guide

Deploying the decentralized Chinese Chess game to **Arbitrum One** mainnet.

> **Anyone can deploy their own frontend.**
> The frontend is a static site with no backend. All you need is a copy of
> the source, a `.env` file with contract addresses, and an IPFS account.
> See [Independent Frontend Deployment](#independent-frontend-deployment) at the bottom of this guide.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Foundry | Smart contract build & deploy toolchain |
| Node.js 18+ | Frontend build |
| ETH on Arbitrum One | Gas fees (~0.001 ETH total for all 3 contracts) |
| Arbiscan API key | Contract verification (free at arbiscan.io) |
| Alchemy/Infura account | Arbitrum RPC endpoint (or use public RPC) |

---

## Step 1 — Install Foundry

**Windows (PowerShell as Admin):**
```powershell
winget install Foundry.Foundry
# Restart terminal after install, then verify:
forge --version
```

**Alternative (via curl in WSL or Git Bash):**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## Step 2 — Install Contract Dependencies

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
```

This populates `contracts/lib/` with:
- `openzeppelin-contracts/` — ERC20, Ownable
- `forge-std/` — Foundry test/script utilities

---

## Step 3 — Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Arbitrum One RPC — get from Alchemy (https://alchemy.com) or Infura
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Deployer wallet private key — NEVER commit this to git
PRIVATE_KEY=0xabc123...

# Arbiscan API key — get from https://arbiscan.io/myapikey
ARBISCAN_API_KEY=ABC123...
```

> **Security:** `.env` is in `.gitignore`. Never share your private key.

---

## Step 4 — Build Contracts

```bash
cd contracts
forge build
```

Expected output:
```
Compiling 5 files with 0.8.24
Compilation successful!
```

If there are errors, check that `lib/` is populated (Step 2).

---

## Step 5 — Run Tests

```bash
forge test -v
```

All tests must pass before deploying to mainnet:

```
Running 14 tests for test/ChineseChess.t.sol:ChineseChessTest
[PASS] test_BoardSetup()
[PASS] test_Player1MovesFirst()
[PASS] test_ResignGivesWinToOpponent()
[PASS] test_TimeoutClaim()
[PASS] test_RookMoveValid()
[PASS] test_RookBlockedByPiece()
[PASS] test_HorseMoveValid()
[PASS] test_HorseHobbled()
[PASS] test_ElephantMoveValid()
[PASS] test_ElephantCannotCrossRiver()
[PASS] test_CannonMoveWithoutCapture()
[PASS] test_CannonCannotMoveOverPiece()
[PASS] test_SoldierMoveForwardPreRiver()
[PASS] test_SoldierCannotMoveSidewaysPreRiver()
...

Running 2 tests for test/ChessPass.t.sol:ChessPassTest
[PASS] test_MintPass()
[PASS] test_CannotMintTwice()
...
```

---

## Step 6 — Deploy to Arbitrum One

```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**What this does:**
1. Deploys `ChessPass` contract
2. Deploys `ChineseChess` contract
3. Deploys `ChessLobby` contract (linked to ChessPass)
4. Calls `ChessLobby.setChineseChess()` to link the game contract
5. Verifies all 3 contracts on Arbiscan automatically

**Expected output:**
```
== Logs ==
ChessPass    : 0xABC...
ChineseChess : 0xDEF...
ChessLobby   : 0x123...
```

Save these 3 addresses — you need them in Step 7.

---

## Step 7 — Set Frontend Environment Variables

Create `frontend/.env` from the example file and fill in the deployed addresses:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_CHESS_PASS_ADDRESS=0xABC...       # from deploy output
VITE_CHESS_LOBBY_ADDRESS=0x123...      # from deploy output
VITE_CHINESE_CHESS_ADDRESS=0xDEF...    # from deploy output

VITE_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
VITE_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

> Addresses are injected into the build at compile time by Vite.
> Never commit `.env` — it is listed in `.gitignore`.

---

## Step 8 — ABIs (already done)

ABIs are already extracted from `forge build` output and committed in
`frontend/src/constants/contracts.ts`. No manual action needed.

If you redeploy contracts after making Solidity changes, regenerate ABIs:
```bash
cd contracts && forge build
# Then copy the new ABI arrays from contracts/out/<Name>.sol/<Name>.json
# into frontend/src/constants/contracts.ts
```

---

## Step 9 — Build & Deploy Frontend

```bash
cd frontend
npm install
npm run build
```

The `dist/` folder contains the static site. Deploy to IPFS:

**Option A — Pinata (recommended):**
1. Go to [pinata.cloud](https://pinata.cloud)
2. Upload the entire `dist/` folder
3. Share the IPFS CID or Pinata gateway URL

**Option B — Fleek:**
1. Connect GitHub repo at [fleek.co](https://fleek.co)
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/dist`
4. Fleek auto-deploys on push and pins to IPFS

**Option C — Traditional hosting (Vercel/Netlify):**
```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod --dir=frontend/dist
```

---

## Post-Deployment Checklist

- [ ] All 3 contracts verified on [arbiscan.io](https://arbiscan.io)
- [ ] `contracts.ts` has correct addresses and ABIs
- [ ] Frontend connects to MetaMask and shows correct network (Arbitrum One, chainId 42161)
- [ ] Can mint a ChessPass (0.01 ETH)
- [ ] Can list a game in the lobby
- [ ] Can join a game
- [ ] Moves submit and confirm on-chain
- [ ] Resign and timeout work correctly
- [ ] Winner receives the full wager (2x)

---

## Contract Summary

| Contract | Purpose | Key Config |
|---|---|---|
| `ChessPass` | Membership NFT — gates access to play | Price: 0.01 ETH, Max supply: 10,000 |
| `ChineseChess` | On-chain game engine | Timeout: 10 min per move |
| `ChessLobby` | Matchmaking and ETH escrow | Requires ChessPass to list/join |

---

## Useful Commands

```bash
# Check contract on Arbiscan after deploy
forge verify-contract <ADDRESS> src/ChessPass.sol:ChessPass \
  --chain arbitrum \
  --etherscan-api-key $ARBISCAN_API_KEY

# Run a single test
forge test --match-test test_RookMoveValid -vvv

# Estimate gas for deployment
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL

# Check contract storage
cast storage <CONTRACT_ADDRESS> 0 --rpc-url $ARBITRUM_RPC_URL

# Read contract value
cast call <CHESS_PASS_ADDRESS> "remainingSupply()" --rpc-url $ARBITRUM_RPC_URL
```

---

## Troubleshooting

**`forge: command not found`**
Foundry is not installed or not in PATH. Re-run `foundryup` and restart your terminal.

**`CompilerError: Source not found`**
Run `forge install` to populate the `lib/` directory.

**`EvmError: Revert` during deploy**
Check that `PRIVATE_KEY` wallet has enough ETH on Arbitrum One for gas.

**`Etherscan: Already verified`**
Contract is already verified — safe to ignore this warning.

**MetaMask shows wrong network**
User must switch to Arbitrum One (Chain ID: 42161) in MetaMask. The app uses Wagmi which will prompt automatically if configured correctly.

**`WrongWagerAmount` error when joining game**
The `msg.value` sent must exactly match the listing's wager amount.

---

## Independent Frontend Deployment

Anyone can deploy their own copy of this frontend without touching the smart contracts.
The contracts are shared on-chain — all frontends talk to the same game data.

### Steps

**1. Get the source code**
```bash
git clone <repo-url>
cd chds-chess/frontend
```

**2. Create your `.env` file**
```bash
cp .env.example .env
```

Edit `.env` with the deployed contract addresses:
```env
VITE_CHESS_PASS_ADDRESS=0xABC...       # from deploy output
VITE_CHESS_LOBBY_ADDRESS=0x123...      # from deploy output
VITE_CHINESE_CHESS_ADDRESS=0xDEF...    # from deploy output

# Optional: use your own RPC for better reliability
VITE_ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
VITE_ARBITRUM_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY
```

**3. Build**
```bash
npm install
npm run build
# Output: dist/ folder — a self-contained static site
```

**4. Upload `dist/` to IPFS**

Any IPFS pinning service works:
- **Pinata** — drag and drop `dist/` folder at pinata.cloud
- **NFT.Storage** — free, IPFS + Filecoin
- **Fleek** — auto-deploy from GitHub, gets its own `.on.fleek.co` URL
- **Local IPFS node** — `ipfs add -r dist/`

**5. Access your deployment**

After uploading you get a CID like `QmXyz...`. Access via:
```
https://ipfs.io/ipfs/QmXyz.../
https://cloudflare-ipfs.com/ipfs/QmXyz.../
https://<CID>.ipfs.dweb.link/
```

### What is and isn't shared

| | Shared across all frontends | Per-frontend |
|---|---|---|
| Game data (board, moves, wagers) | ✅ On-chain | — |
| Player passes and win records | ✅ On-chain | — |
| Contract addresses | ✅ Same contracts | — |
| RPC endpoint | — | ✅ Each deployer sets their own |
| UI theme / language | — | ✅ Anyone can customise |
| IPFS URL / ENS domain | — | ✅ Each deployer gets their own |

### Important

- The `.env` file is **never committed** (it's in `.gitignore`)
- Contract addresses are **baked into the build** at `npm run build` time
- If contract addresses change (e.g. new deployment), you must rebuild and re-upload
