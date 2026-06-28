# Decentralized Chinese Chess

On-chain Chinese Chess game on Arbitrum One. No central server — all game logic runs on the blockchain, frontend is hosted on IPFS.

## Project Structure

```
chds-chess/
├── contracts/          Smart contracts (Solidity + Foundry)
│   ├── src/
│   │   ├── ChessPass.sol       ERC-721 soulbound membership NFT
│   │   ├── ChineseChess.sol    On-chain game engine (all piece rules)
│   │   └── ChessLobby.sol      Matchmaking + ETH escrow
│   ├── test/           Forge test suite (45 tests)
│   └── script/         Deployment script
└── frontend/           React + TypeScript + Tailwind + wagmi
    └── src/
        ├── components/ ChessBoard, ConnectWallet, NetworkGuard, Toast, PieceLegend
        ├── constants/  Contract addresses + ABIs
        ├── pages/      Mint, Lobby, Game, Profile, Leaderboard
        └── hooks/      Dev mode, direct wallet, local signer, session keys
```

## Requirements

- [Foundry](https://getfoundry.sh/) — smart contract toolchain
- [Node.js 18+](https://nodejs.org/) — frontend
- A wallet with ETH on Arbitrum One (mainnet) or Arbitrum Sepolia (testnet)

## Session Keys

Games support scoped session keys to reduce wallet popups during play:

- Players authorize a temporary browser-generated key for one `gameId`.
- The key can only call `submitMove` for that game.
- It cannot resign, claim timeout, withdraw funds, mint passes, or affect other games.
- It expires after a short period and can be revoked from the game screen.

This keeps move validation and settlement on-chain while avoiding a MetaMask confirmation for every move.

## Quick Start

### 1. Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### 2. Deploy contracts

```bash
# Copy and fill in contracts/.env
cp .env.example .env

# Deploy to Arbitrum Sepolia (testnet)
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_RPC_URL \
  --broadcast --verify

# Note the 3 contract addresses printed in output
```

### 3. Frontend

```bash
cd frontend

# Copy and fill in the 3 contract addresses from step 2
cp .env.example .env

npm install
npm run dev      # development server
npm run build    # production build → dist/
```

### 4. Deploy frontend to IPFS

```bash
# Upload the dist/ folder to Pinata, Fleek, or any IPFS pinning service
# See DEPLOYMENT.md for full instructions
```

## Piece Reference

| Letter | Piece    | Notes |
|--------|----------|-------|
| K      | General  | Stays in palace, cannot face opposing K |
| A      | Advisor  | Diagonal 1 step, stays in palace |
| E      | Elephant | Diagonal 2 steps, cannot cross river |
| H      | Horse    | L-shape (2+1), blocked if first step is occupied |
| R      | Rook     | Any orthogonal distance, no jumping |
| C      | Cannon   | Moves like R; captures by jumping over exactly 1 piece |
| S      | Soldier  | Forward only before river; forward + sideways after |

Red pieces play from the bottom (rows 7–9). Black pieces play from the top (rows 0–2).

## Contracts (Arbitrum One)

| Contract     | Address           |
|---|---|
| ChessPass    | TBD after deploy  |
| ChessLobby   | TBD after deploy  |
| ChineseChess | TBD after deploy  |

## Documentation

| File | Contents |
|---|---|
| `DEPLOYMENT.md` | Step-by-step deployment guide + independent frontend deployment |
| `GAME_DESIGN_PLAN.md` | Product vision and feature spec |
| `PRODUCT_ROADMAP.md` | Current build status and remaining tasks |
