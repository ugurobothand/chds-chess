# Chinese Chess User Guide

This guide describes the production user flow for playing Chinese Chess through the web app.

## Navigation

| Tab | Purpose |
|---|---|
| Mint | Claim a Chess Pass. A wallet must own a pass before it can create or join games. |
| Lobby | View open games, create a new game, or join another player's game. |
| Game #ID | Return to the most recently opened game board. This appears after you visit a game page. |
| Profile | View wallet address, Chess Pass status, win/loss record, and resume the latest game. |
| Leaderboard | View rankings from finished on-chain games. |
| Help | Read multilingual usage instructions. |

## Start to Play

1. Connect your wallet.
2. Switch to a supported network.
3. Open **Mint** and click **Mint Pass** to claim a Chess Pass for your wallet.
4. Open **Lobby** and click **Create Game**.
5. Choose a wager and publish the open game.
6. Another player with a Chess Pass opens **Lobby** and clicks **Join**.
7. After joining, both players enter the same `/game/:gameId` page.
8. Red moves first, then Black responds in turns.
9. Every move is submitted on-chain and validated by the `ChineseChess` contract.
10. The game can end by checkmate, resignation, or timeout claim.
11. The contract handles the final result and escrow settlement.

## Auto Moves

By default, every move is an on-chain transaction from the player's main wallet, so the wallet asks for confirmation each turn.

To reduce wallet popups:

1. Open the game page.
2. Click **Enable Auto Moves**.
3. Confirm the session-key authorization with your wallet.
4. Confirm the small gas transfer to the temporary session key.
5. Move pieces normally.

After authorization, regular moves for that game are submitted by the temporary session key.

The session key is intentionally narrow:

| Permission | Allowed |
|---|---|
| Submit moves for the current gameId | Yes |
| Submit moves for another game | No |
| Resign | No |
| Claim timeout | No |
| Withdraw or settle funds directly | No |
| Mint passes | No |
| Use after expiry | No |

Each player must enable Auto Moves separately. A session key is scoped to the current browser, wallet, and gameId.

## Important Notes

- Lobby only shows open games that have not been joined yet.
- Once another player joins, the game disappears from Lobby because it is already active.
- Use **Game #ID** in the top navigation or **Resume Game** in Profile to return to an active game.
- Resignation, timeout claims, and fund-related actions still require the main wallet.
- If you change accounts, browsers, or gameId, you may need to enable Auto Moves again.

