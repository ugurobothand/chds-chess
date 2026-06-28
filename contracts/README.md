# Chinese Chess Contracts

A Foundry-based Solidity project implementing on-chain Chinese Chess (Xiangqi) with wagered matches, a soulbound membership pass, and a lobby for matchmaking.

## Contracts

- **ChessPass** (`src/ChessPass.sol`) — Soulbound ERC-721 membership pass. Max 10,000 supply, one per wallet, non-transferable. Mint price: 0.01 ETH.
- **ChineseChess** (`src/ChineseChess.sol`) — Core game engine. Stores board state, validates moves per Xiangqi rules, handles timeouts, resignation, and wager payouts.
- **ChessLobby** (`src/ChessLobby.sol`) — Matchmaking lobby. Pass holders can list open games with a wager, join others' games, or cancel their listings.
- **Deploy** (`script/Deploy.s.sol`) — Deployment script that wires ChessPass, ChineseChess, and ChessLobby together.

## Tech Stack

- Solidity 0.8.24
- Foundry
- OpenZeppelin Contracts

## Setup

```bash
# Install Foundry dependencies (already present as submodules)
forge install

# Run tests
forge test

# Format code
forge fmt

# Build
forge build
```

## Deploy

```bash
source .env
forge script script/Deploy.s.sol --rpc-url $ARBITRUM_RPC_URL --broadcast --verify
```

## Game Rules

The board is represented as a 90-cell array (`9 cols × 10 rows`). Piece codes:

| Piece     | Red | Black |
|-----------|-----|-------|
| General   | 1   | 11    |
| Advisor   | 2   | 12    |
| Elephant  | 3   | 13    |
| Horse     | 4   | 14    |
| Rook      | 5   | 15    |
| Cannon    | 6   | 16    |
| Soldier   | 7   | 17    |

Move validation enforces palace constraints, river crossing for elephants, horse hobbling, cannon jump-capture, soldier advancement, and the flying-general rule.

## Known Limitations / Next Steps

- Win detection is currently "capture the enemy General" only; checkmate/stalemate detection is not implemented.
- Draw by repetition or mutual agreement is not yet supported.
- `ChessLobby` unit tests are a work in progress.
