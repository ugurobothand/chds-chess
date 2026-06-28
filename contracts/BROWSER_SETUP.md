# Browser Setup Guide for Local Testing

The frontend uses MetaMask to talk to your local Anvil blockchain.

## Known issue: wallet extension conflicts

If you have **Phantom + MetaMask** (or other wallets) installed, they fight over `window.ethereum` and cause `ObjectMultiplex` errors. The frontend cannot fix this — you must remove the conflicting wallet extension.

## Required: use a browser with ONLY MetaMask

### Option 1: Chrome Guest mode (fastest)

1. Click your Chrome profile icon (top right)
2. Select **Guest**
3. Install MetaMask from [metamask.io](https://metamask.io)
4. Import the Anvil test private key:
   ```text
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
5. Add the Anvil network:
   - Network name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
6. Open `http://localhost:3000/frontend.html`
7. Click **Connect MetaMask**, then **Mint Pass**

### Option 2: New Chrome profile

1. Click your Chrome profile icon → **Add** → **Continue without an account**
2. Install only MetaMask
3. Follow steps 4–7 above

### Option 3: Disable conflicting extensions

1. Go to `chrome://extensions/`
2. Turn OFF every wallet/privacy extension except MetaMask:
   - Phantom
   - Rabby
   - Coinbase Wallet
   - Trust Wallet
   - Brave Wallet
   - uBlock Origin (advanced mode)
   - Any script blocker
3. Restart Chrome
4. Open `http://localhost:3000/frontend.html`

## Verify before minting

After connecting, the page should show:

```text
Connected: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Balance: 10000.0 ETH
```

If you see a different address, you are using the wrong account.

## Start the server

In a terminal:

```bash
cd /Users/r/AndroidStudioProjects/chds-chess/contracts
python3 serve.py
```

Keep it running while you use the frontend.
