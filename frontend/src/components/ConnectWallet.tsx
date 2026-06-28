import { useChainId } from 'wagmi'
import { arbitrum, arbitrumSepolia, hardhat } from 'wagmi/chains'
import { useState } from 'react'
import { useDirectWallet } from '../hooks/useDirectWallet'
import { useDevMode } from '../hooks/useDevMode'
import { ANVIL_ACCOUNTS } from '../hooks/useLocalSigner'

const CHAIN_LABELS: Record<number, { label: string; color: string }> = {
  [arbitrum.id]:        { label: 'Arbitrum One',  color: 'text-blue-400'  },
  [arbitrumSepolia.id]: { label: 'Arb Sepolia',   color: 'text-yellow-400' },
  [hardhat.id]:         { label: 'Localhost',     color: 'text-green-400'  },
}

export default function ConnectWallet() {
  const { address, isConnected } = useDirectWallet()
  const chainId = useChainId()
  const { accountIndex, setAccountIndex, isDevMode } = useDevMode()
  const [error, setError] = useState('')

  async function handleConnect() {
    setError('')
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      setError('MetaMask not found')
      return
    }
    try {
      await ethereum.request({ method: 'eth_requestAccounts' })
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || 'Connection failed')
    }
  }

  async function handleDisconnect() {
    const ethereum = (window as any).ethereum
    try {
      if (ethereum) {
        await ethereum.request?.({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        })
        ethereum.removeAllListeners?.()
      }
    } catch (err: any) {
      setError(err?.message || 'Disconnect failed')
    } finally {
      window.location.reload()
    }
  }

  if (isDevMode) {
    const acc = ANVIL_ACCOUNTS[accountIndex ?? 0]
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-green-400 font-semibold">Dev Mode</span>
        <span className="text-sm text-gray-400 font-mono">
          {acc.address.slice(0, 6)}…{acc.address.slice(-4)}
        </span>
        <button
          onClick={() => { setAccountIndex(null); window.location.reload() }}
          className="text-sm px-3 py-1 rounded border border-gray-600 hover:border-red-400
            hover:text-red-400 transition-colors"
        >
          Exit Dev
        </button>
      </div>
    )
  }

  if (isConnected && address) {
    const chain = CHAIN_LABELS[chainId ?? 0]
    return (
      <div className="flex items-center gap-3">
        {chain && (
          <span className={`text-xs font-medium ${chain.color}`}>
            {chain.label}
          </span>
        )}
        <span className="text-sm text-gray-400 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-sm px-3 py-1 rounded border border-gray-600 hover:border-red-400
            hover:text-red-400 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleConnect}
        className="text-sm px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-400
          text-black font-semibold transition-colors"
      >
        Connect Wallet
      </button>
      <select
        value={accountIndex ?? ''}
        onChange={(e) => {
          const idx = e.target.value === '' ? null : Number(e.target.value)
          setAccountIndex(idx)
          if (idx !== null) window.location.reload()
        }}
        className="text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
      >
        <option value="">— Dev Mode —</option>
        {ANVIL_ACCOUNTS.map((acc, i) => (
          <option key={i} value={i}>{acc.name}</option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
