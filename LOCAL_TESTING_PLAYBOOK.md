# Local Testing Playbook

This guide is for one developer testing the full game locally with two wallets on Anvil.

For the production user flow, see `USER_GUIDE.md`.

## Start to Play Locally

1. Start Anvil.

   ```bash
   anvil
   ```

2. Deploy the contracts to Anvil.

   ```bash
   cd contracts

   forge script script/Deploy.s.sol \
     --rpc-url http://127.0.0.1:8545 \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
     --broadcast \
     -vvvv
   ```

3. Copy the printed contract addresses into `frontend/.env`.

4. Start the frontend.

   ```bash
   cd frontend
   npm run dev -- --host 127.0.0.1
   ```

5. Add the Anvil network to MetaMask.

   | Field | Value |
   |---|---|
   | Network name | `Anvil Local` |
   | RPC URL | `http://127.0.0.1:8545` |
   | Chain ID | `31337` |
   | Currency symbol | `ETH` |

6. Import the first Anvil account in the main browser.

   | Item | Value |
   |---|---|
   | Address | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
   | Private key | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

7. Import the second Anvil account in another browser, incognito window, or browser profile.

   | Item | Value |
   |---|---|
   | Address | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
   | Private key | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

8. With the first account, open `http://127.0.0.1:5173`, connect the wallet, and mint a Chess Pass.

9. With the second account, open `http://127.0.0.1:5173`, connect the wallet, and mint a Chess Pass.

10. With the first account, open **Lobby** and click **Create Game**.

    For local testing, use wager `0`.

11. With the second account, open **Lobby** and click **Join** on the open game.

12. After joining, both browsers should open the same `/game/:gameId` page.

13. Red moves first with the first account.

14. Black responds with the second account.

15. Continue moving in turns.

16. Optional: each account can click **Enable Auto Moves** on the game page.

    The first time requires wallet confirmations for session-key authorization and gas funding. After that, ordinary moves for that account and game should not open MetaMask every turn.

## Useful Test Moves

If you want to verify the move engine quickly:

| Side | Move | Meaning |
|---|---|---|
| Red | `fromPos 54 -> toPos 45` | Red soldier moves forward one square |
| Black | `fromPos 27 -> toPos 36` | Black soldier moves forward one square |

Board positions use:

```text
position = row * 9 + col
```

Rows are `0..9`; columns are `0..8`.

## Common Local Testing Notes

- Lobby only shows open games that have not been joined yet.
- Once the second account joins, the game disappears from Lobby because it is active.
- Use `Game #ID` in the top navigation or `Resume Game` in Profile to return to the active board.
- If a second browser does not show `Game #ID`, open `/game/:gameId` once in that browser so it can remember the latest game locally.
- If the page still reads old contract state, force refresh with `Cmd + Shift + R`.
- If Anvil was restarted, all local chain state is reset. Deploy again, update `frontend/.env`, mint passes again, and create a new game.

## Safety

The Anvil private keys in this document are public test keys.

Never use them on mainnet or any network with real funds.

