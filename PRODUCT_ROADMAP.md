# chds-chess — Product Roadmap & Improvement Plan

> Current status: Framework only. Contracts solid. Frontend has no game functionality.
> Last reviewed: 2026-05-21

---

## 1. Honest Current State

### 1.1 Smart Contracts

| Contract | What it does | Status |
|---|---|---|
| `ChessPass.sol` | ERC-721 Soulbound NFT — gates access to the game | Complete |
| `ChineseChess.sol` | On-chain game engine — all 7 piece rules + Flying General | Complete |
| `ChessLobby.sol` | Matchmaking — create/join/cancel games with ETH escrow | Complete |
| Tests | ChessPass + ChineseChess test suites | Comprehensive |
| Deployment | Not deployed — all addresses still `0x000` | **Pending** |

Contracts are production-ready in logic. They are not yet deployed to any network.

---

### 1.2 Frontend

| File | What exists | Functional? |
|---|---|---|
| `ConnectWallet.tsx` | MetaMask + Coinbase Wallet connection | Complete |
| `wagmi.config.ts` | Arbitrum One RPC, wallet connectors | Complete |
| `MintPage.tsx` | Mint pass UI — reads supply, sends 0.01 ETH | Ready (needs ABI) |
| `ProfilePage.tsx` | Displays wins / losses per wallet | Ready (needs ABI) |
| `LobbyPage.tsx` | "Create Game" button with no handler | **0% functional** |
| `GamePage.tsx` | Placeholder div — "Chess board renders here" | **20% — no board** |
| `LeaderboardPage.tsx` | Table structure only — no data | **30% — UI only** |
| `constants/contracts.ts` | All addresses `0x000`, all ABIs empty `[]` | **Blocks everything** |

---

### 1.3 Summary in Plain Terms

> The wallet connection works. The Mint page and Profile page are fully built.
> But the game itself does not exist in the frontend — there is no chess board,
> no way to create or join a game, and no leaderboard data.
> Nothing talks to the blockchain yet because addresses and ABIs are not filled in.

---

## 2. What Is Missing for a Complete Product

### Critical — Game is unplayable without these

#### A. Chess Board UI (Biggest gap)
The `GamePage` has a single placeholder div where the board should be.
A complete chess board component needs:
- 9 × 10 grid with correct proportions and colors
- Piece images for all 14 types (K=General, A=Advisor, E=Elephant, H=Horse, R=Rook, C=Cannon, S=Soldier)
- Click to select a piece → highlight valid squares → click destination to move
- Whose turn indicator (Red / Black)
- Wager amount display
- Move count display
- Resign button wired to `resign()` contract function
- Claim Timeout button wired to `claimTimeout()` contract function
- Real-time board sync using `useGameState` hook (already built)
- Move submission using `useSubmitMove` hook (already built)
- Transaction status: pending → confirming → confirmed

#### B. Lobby Page
Players currently have no way to start a game. Needs:
- "Create Game" form — input wager amount, sends ETH to `ChessLobby.listGame()`
- Live list of open games fetched from `ChessLobby.getOpenGames()`
- Each listing shows: creator address, wager amount, time listed
- "Join" button per listing — sends matching ETH to `ChessLobby.joinGame()`
- "Cancel" button for your own listing — `ChessLobby.cancelGame()`
- Redirects to `/game/:gameId` after joining

#### C. Contract Deployment + ABI Wiring
Nothing in the frontend works until:
1. Contracts are deployed to Arbitrum Sepolia (testnet)
2. Deployed addresses are pasted into `constants/contracts.ts`
3. ABIs are generated via `forge build` and pasted into `constants/contracts.ts`

After this: MintPage, ProfilePage, and all hooks become functional immediately.

---

### Important — Needed before launch

#### D. Leaderboard Page
The table UI exists but never populates. Needs:
- Read `GameFinished` events from `ChineseChess` contract
- Index: winner address, game count, win count
- Sort players by win count
- Options: use `useWatchContractEvent` (wagmi) for live updates, or The Graph subgraph for historical data

#### E. Security — Reentrancy Protection
Both `ChineseChess._finishGame` and `ChessLobby.cancelGame` send ETH
using `.call{value:}` with no reentrancy guard. A malicious contract wallet
could exploit this in a game with real ETH wagers.

Fix: add OpenZeppelin `ReentrancyGuard` to both contracts.

```
Affected functions:
  ChineseChess._finishGame()   → winnerAddr.call{value: g.wager * 2}("")
  ChessLobby.cancelGame()      → msg.sender.call{value: listing.wager}("")
  ChessLobby.joinGame()        → chineseChess.createGame{value:}(...)
```

#### F. NFT Metadata + Artwork
ChessPass NFTs currently show no image or name in MetaMask / OpenSea.
Needs:
- Design artwork for the pass (e.g., chess piece illustration, #1–#10,000 numbering)
- Create metadata JSON files (name, description, image, attributes)
- Upload to IPFS (Pinata or NFT.Storage)
- Call `ChessPass.setBaseURI("ipfs://YOUR_CID/")` after deployment

#### G. Error Handling + User Feedback
No error messages shown anywhere if a transaction fails. Needs:
- Toast notifications for transaction states (pending / confirmed / failed)
- Wallet not connected prompts
- Wrong network prompt (must be Arbitrum One)
- Insufficient ETH warnings

---

### Nice to Have — Polish after launch

- Move history panel (list of moves made in the current game)
- Highlight last move on the board
- Sound effects (piece move, capture, win)
- Mobile layout optimization
- Game chat between players (requires off-chain solution, e.g., XMTP)
- Chinese / English language toggle (appropriate for Chinese Chess)
- Animations for piece movement

---

## 3. Security Checklist Before Mainnet

| Issue | Severity | Fix |
|---|---|---|
| ~~No reentrancy guard on ETH payout in `_finishGame`~~ | ~~High~~ | ✅ Fixed — `nonReentrant` on `submitMove`, `claimTimeout`, `resign` |
| ~~No reentrancy guard on ETH refund in `cancelGame`~~ | ~~High~~ | ✅ Fixed — `nonReentrant` on `cancelGame`, `joinGame` |
| `ChessPass.setBaseURI` callable after minting (can change metadata) | Medium | Accept by design or lock after deploy |
| ~~No check: `createGame` can be called by anyone, not just ChessLobby~~ | ~~Medium~~ | ✅ Fixed — `onlyLobby` modifier + `setLobby()` |
| Payout uses `wager * 2` — overflow possible if wager is huge | Low | Already safe in Solidity 0.8+ (built-in overflow checks) |
| No security audit | High (if wagers > trivial) | Commission audit before mainnet |

---

## 4. Build Plan — Phase by Phase

### Phase 1 — Security + Deployment (1–2 days)
Get the app functional on testnet so real testing can begin.

- [x] Add `ReentrancyGuard` to `ChineseChess.sol` (`submitMove`, `claimTimeout`, `resign`)
- [x] Add `ReentrancyGuard` to `ChessLobby.sol` (`cancelGame`, `joinGame`)
- [x] Add `onlyLobby` modifier to `ChineseChess.createGame` + `setLobby()` function + deploy script updated
- [x] Install Foundry + run `forge build` + `forge test` — **31/31 tests passed**
- [ ] Deploy all 3 contracts to **Arbitrum Sepolia** testnet ⚠️ USER ACTION — requires `.env` + testnet ETH
- [ ] Fill deployed addresses into `frontend/.env` ⚠️ USER ACTION — after deploy (copy `.env.example` → `.env`)
- [x] Extract ABIs from `contracts/out/` into `contracts.ts` — generated by forge build
- [x] Contract addresses read from `VITE_` env vars — anyone can deploy frontend without editing source code
- [ ] Verify: MintPage mints a pass on testnet ⚠️ USER ACTION — after deploy
- [ ] Verify: ProfilePage shows wins/losses ⚠️ USER ACTION — after deploy

**Done when:** MintPage and ProfilePage work end-to-end on Arbitrum Sepolia.

---

### Phase 2 — Core Game Functionality (1 week)
Build the heart of the product.

#### 2A — Lobby Page
- [x] Wire `getOpenGames()` — display live list of open games (auto-refresh 5s)
- [x] "Create Game" — wager input modal, sends ETH to `ChessLobby.listGame()`
- [x] "Join Game" — sends matching ETH, parses `GameStarted` event, redirects to `/game/:id`
- [x] "Cancel" — calls `ChessLobby.cancelGame()`, ETH refunded
- [x] Auto-refresh game list every 5 seconds

#### 2B — Chess Board Component
- [x] Render 9×10 board grid with river visual ("— RIVER —" separator)
- [x] Place pieces from `uint8[90]` — all 14 types with English labels (K/A/E/H/R/C/S), colored circles
- [x] Click piece to select → highlight with ring
- [x] Click destination → calls `submitMove()` via wagmi writeContract
- [x] Board locked with overlay while transaction pending / confirming
- [x] Board auto-refreshes after confirmed move
- [x] Whose turn indicator (green = my turn)
- [x] Wager, move count, game status display

#### 2C — Game Controls
- [x] Resign button → calls `resign()` → toast notification
- [x] Claim Timeout button → calls `claimTimeout()` → toast notification
- [x] Game over banner with winner, payout amount shown

**Done when:** Two wallets can play a complete game of Chinese Chess in the browser on testnet.

---

### Phase 3 — Complete the Product (3–4 days)

- [x] **Leaderboard** — indexes `GameFinished` events via `getLogs`, batch-reads wins/losses, sorts by wins
- [x] **Error handling** — toast notifications (`Toast.tsx`) for all transaction states across all pages
- [ ] **NFT Artwork** — design pass image, upload metadata to IPFS, call `setBaseURI()` ⚠️ USER ACTION
- [x] **Wrong network** — `NetworkGuard.tsx` banner with one-click switch to Arbitrum One
- [x] **Mobile layout** — chess board uses responsive cells (`w-9 sm:w-11`), fits 375px screens

**Done when:** All 5 pages are fully functional, NFTs show artwork in MetaMask.

---

### Phase 4 — Testing & Launch (2–3 days)

- [ ] Play 10+ complete games end-to-end on testnet
- [ ] Test every edge case: timeout, resign, cannon capture, flying general
- [ ] Fix all bugs found
- [ ] Deploy contracts to **Arbitrum One mainnet**
- [ ] Update `contracts.ts` with mainnet addresses
- [ ] `npm run build` → deploy `dist/` to IPFS (Pinata or Fleek)
- [ ] Register ENS domain (e.g. `chinesechess.eth`) → point to IPFS hash
- [ ] Announce

**Done when:** Live on Arbitrum One, accessible via browser and ENS domain.

---

## 5. Effort Summary

| Phase | Work | Time estimate |
|---|---|---|
| Phase 1 — Security + Deployment | Fix 3 security issues, deploy to testnet, wire ABIs | 1–2 days |
| Phase 2 — Core Game | Chess board UI + Lobby page + game controls | 5–7 days |
| Phase 3 — Complete Product | Leaderboard + NFT art + error handling + mobile | 3–4 days |
| Phase 4 — Testing + Launch | End-to-end testing + mainnet deploy + IPFS | 2–3 days |
| **Total** | | **~2–3 weeks** |

---

## 6. What the Project Looks Like Today vs at Launch

| | Today | At Launch |
|---|---|---|
| Can mint a pass | UI ready, not deployed | Yes — 0.01 ETH, shows in MetaMask |
| Can see open games | No | Yes — live list in lobby |
| Can create a game | No | Yes — set wager, confirm transaction |
| Can play chess | No | Yes — full 9×10 board, click to move |
| Can win ETH wager | No | Yes — auto-paid on chain |
| Win/loss record | Not live | Yes — on-chain, visible in profile |
| Leaderboard | Empty | Yes — indexed from chain events |
| NFT artwork | None | Yes — image visible in MetaMask/OpenSea |
| Accessible URL | None | Yes — ENS domain + IPFS |

---

## 7. Recommended Next Step

**Start with Phase 1** — add reentrancy protection and deploy to testnet.
This unblocks all testing and makes MintPage + ProfilePage live immediately.
Then move to Phase 2 and build the chess board — that is the most important
and most complex piece of work in the entire project.

---

*Document version: 1.0 | Created: 2026-05-21 | Project: chds-chess on Arbitrum One*
