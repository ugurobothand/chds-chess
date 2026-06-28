# Decentralized Chinese Chess — Project Design Plan

> For project owner to share with developers
> Chain: Arbitrum One (ETH L2) | Players: 10,000 max | No central server

---

## What We Are Building

A fully decentralized Chinese Chess game on blockchain.
- Players hold a soulbound NFT pass to enter (max 10,000, 1 per wallet, non-transferable)
- All games are recorded on-chain — no server needed
- Players can optionally bet ETH against each other
- The website is hosted on IPFS — no one can shut it down

---

## Core Features (Must Have)

| # | Feature | Description |
|---|---|---|
| 1 | Soulbound NFT Pass | Mint an NFT pass to become a player. Only 10,000 total. Non-transferable. Visible in wallets. |
| 2 | Game Lobby | See who is looking for a game. Challenge them. |
| 3 | Chess Game | Play a full Chinese Chess game on-chain. |
| 4 | Win Detection | Smart contract detects win when the General is captured. |
| 5 | Timeout Protection | If opponent disappears, claim win after 10 minutes. |
| 6 | ETH Wager | Optional — both players lock ETH, winner takes all. |
| 7 | Leaderboard | On-chain win/loss record per player. |

---

## What Needs to Be Built

### Part A — Smart Contracts (Blockchain)
Three contracts:

**1. ChessPass Contract (ERC-721 Soulbound NFT)**
- ERC-721 NFT, 1 token per wallet, permanently non-transferable (soulbound)
- Token IDs run from 1 to 10,000 (sequential, first come first served)
- Players pay 0.01 ETH to mint one pass
- Only pass holders can list or join games
- Visible in MetaMask NFT tab and on OpenSea
- Owner can set metadata base URI (for artwork/traits)

**2. Lobby Contract**
- Player lists themselves as "looking for game" with optional ETH wager
- Another player joins to start a match (must send matching wager)
- Escrows ETH until game contract is created
- Creator can cancel and get ETH back

**3. Game Contract**
- Stores the 9×10 board state on-chain (90 squares)
- Validates every move according to Chinese Chess rules (all 7 piece types)
- Win condition: capturing the opponent's General piece
- Handles timeout (10 minutes per move) and resign
- Pays out full wager (2×) to winner automatically
- Note: checkmate is not automatically detected — the General must be physically captured to end the game

---

### Part B — Website (Frontend)
One React website, hosted on IPFS (no server):

**Pages needed:**
1. **Mint Page** — buy your ERC-20 access pass (0.01 ETH)
2. **Lobby Page** — see open games, create a game, join a game
3. **Game Page** — the actual chess board, your moves, opponent moves
4. **Profile Page** — your pass status, your win/loss record
5. **Leaderboard Page** — top players by wins

---

## Development Order (Start Here)

```
Step 1 → Build and test smart contracts first
Step 2 → Deploy contracts to testnet (Arbitrum Sepolia)
Step 3 → Build the website connected to testnet
Step 4 → Test full game flow end to end
Step 5 → Deploy to mainnet (Arbitrum One) + IPFS
```

**Why this order:**
The website depends on the contracts. Contracts must be stable before building the frontend. Never build frontend first.

---

## Phase Breakdown

### Phase 1 — Smart Contracts (1 week)
Developer task: write and test all 3 contracts

- [ ] ChessPass ERC-721 soulbound contract (mint, 10,000 limit, non-transferable, tokenURI)
- [ ] Lobby contract (create game, join game, cancel, ETH escrow)
- [ ] Game contract (board state, move validation, win detection)
- [ ] All 7 piece types must be validated correctly
- [ ] Flying General rule must be enforced
- [ ] Write tests for every piece movement and edge case
- [ ] Deploy to Arbitrum Sepolia testnet

**Done when:** A complete game can be played through command line on testnet

---

### Phase 2 — Website (1 week)
Developer task: build React frontend connected to testnet contracts

- [ ] Wallet connect (MetaMask / Coinbase Wallet)
- [ ] Mint pass page (shows remaining supply, 0.01 ETH price)
- [ ] Lobby page (list games, create, join)
- [ ] Chess board (correct pieces, click to move)
- [ ] Game syncs with on-chain state in real time
- [ ] Timeout and resign buttons work
- [ ] Wager display and payout confirmation

**Done when:** Two players can play a full game in the browser on testnet

---

### Phase 3 — Testing & Launch (3–4 days)
- [ ] Play 10+ full games end to end
- [ ] Test all edge cases (cannon rule, general face rule, timeout, resign)
- [ ] Fix all bugs found
- [ ] Deploy contracts to Arbitrum One mainnet
- [ ] Build and deploy website to IPFS
- [ ] Set up ENS domain (e.g. `chinesechess.eth`)

**Done when:** Live on mainnet, accessible via ENS domain

---

## Key Decisions (Confirmed)

| Decision | Choice |
|---|---|
| L2 Chain | **Arbitrum One** |
| Pass token standard | **ERC-721 Soulbound NFT** (non-transferable, 1 per wallet) |
| Mint price per pass | **0.01 ETH** |
| Wager | **Optional** |
| Timeout limit | **10 minutes** per move |
| Frontend hosting | **IPFS** (no server) |
| ENS domain | **.eth** (standard ENS) |

---

## What the Developer Needs to Know

### Must have skills
- Solidity (smart contract development)
- Foundry (build, test, deploy)
- React + TypeScript
- wagmi / viem (wallet + chain connection)
- IPFS deployment

### Chinese Chess rule complexity warning
Tell your developer: **the move validation is the hardest part.**
Specifically these rules take the most time to get right:
- Cannon must jump exactly 1 piece to capture (not 0, not 2)
- Two generals cannot face each other with no pieces between them (Flying General rule)
- Elephant cannot cross the river
- Horse is blocked if the first orthogonal step is occupied (hobbling)
- Soldier can only move sideways after crossing the river

Ask them to write tests for every rule before moving to the frontend.

### Important limitation to understand
The contract ends the game when the General piece is **physically captured** — not at checkmate. This means:
- A player can legally make a move that leaves their General in danger
- The opponent will simply capture the General on their next move to win
- This is simpler than full checkmate detection and works well in practice

---

## Budget Estimate

| Item | Cost |
|---|---|
| Developer (2–3 weeks with Claude Code) | $4,000–$8,000 |
| Contract deployment to Arbitrum One | ~$5–15 |
| IPFS hosting (Pinata, 1 year) | ~$20/year |
| ENS domain (.eth, 1 year) | ~$5–20/year |
| **Minimum total** | **~$4,050** |
| Security audit (optional, recommended if wagers enabled) | +$5,000–$20,000 |

---

## Timeline Summary

| Week | What Happens |
|---|---|
| Week 1 | Smart contracts written and tested on Arbitrum Sepolia testnet |
| Week 2 | Website built and connected to testnet contracts |
| Week 3 | Full testing, bug fixing, Arbitrum One mainnet launch |

**Total: 2–3 weeks with an experienced developer using Claude Code**

---

## What You (Project Owner) Need to Do

1. Set up an Arbitrum One wallet for contract deployment
2. Prepare ETH on Arbitrum One for deployment gas (~0.005 ETH is enough)
3. Get an Alchemy or Infura API key for Arbitrum RPC
4. Get an Arbiscan API key (free at arbiscan.io) for contract verification
5. Buy an ENS domain (e.g. `chinesechess.eth`) at app.ens.domains
6. Review and approve the contracts before mainnet deployment

---

## What Success Looks Like

- Player opens website on phone or PC
- Connects their crypto wallet (MetaMask or Coinbase Wallet)
- Mints a soulbound NFT pass (pays 0.01 ETH) — appears in MetaMask NFT tab
- Sees lobby — finds or creates a game with optional ETH wager
- Plays full Chinese Chess game in browser — moves confirmed on Arbitrum One
- Winner automatically receives full ETH wager (2×)
- No server, no company, no shutdown possible

---

*Plan version: 1.3 | Updated: 2026-05-21 | Chain: Arbitrum One | Pass: ERC-721 Soulbound*
