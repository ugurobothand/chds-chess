import { useState, useEffect, useCallback } from 'react'

const KEY = 'chds:wallet-state'

type WalletState = {
  address?: string
  isConnected: boolean
  chainId?: number
}

function readStoredState(): WalletState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return { isConnected: false }
    const parsed = JSON.parse(raw) as WalletState
    return {
      address: parsed.address,
      isConnected: Boolean(parsed.isConnected && parsed.address),
      chainId: parsed.chainId,
    }
  } catch {
    return { isConnected: false }
  }
}

function writeStoredState(state: WalletState) {
  try {
    if (!state.isConnected || !state.address) {
      sessionStorage.removeItem(KEY)
      return
    }
    sessionStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

export function useDirectWallet() {
  const stored = readStoredState()
  const [address, setAddress] = useState<string | undefined>(stored.address)
  const [isConnected, setIsConnected] = useState(stored.isConnected)
  const [chainId, setChainId] = useState<number | undefined>(stored.chainId)

  const refresh = useCallback(async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      setIsConnected(false)
      setAddress(undefined)
      setChainId(undefined)
      writeStoredState({ isConnected: false })
      return
    }
    try {
      const accounts: string[] = await ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        const nextAddress = accounts[0]
        setAddress(nextAddress)
        setIsConnected(true)
        try {
          const cid: string = await ethereum.request({ method: 'eth_chainId' })
          const nextChainId = parseInt(cid, 16)
          setChainId(nextChainId)
          writeStoredState({ address: nextAddress, isConnected: true, chainId: nextChainId })
        } catch {
          // ignore chainId errors
          writeStoredState({ address: nextAddress, isConnected: true })
        }
      } else {
        setIsConnected(false)
        setAddress(undefined)
        setChainId(undefined)
        writeStoredState({ isConnected: false })
      }
    } catch {
      setIsConnected(false)
      setAddress(undefined)
      setChainId(undefined)
      writeStoredState({ isConnected: false })
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)

    const ethereum = (window as any).ethereum
    if (ethereum && typeof ethereum.on === 'function') {
      try {
        ethereum.on('accountsChanged', refresh)
        ethereum.on('chainChanged', refresh)
      } catch {
        // ignore listener errors
      }
    }

    return () => {
      clearInterval(interval)
      if (ethereum && typeof ethereum.removeListener === 'function') {
        try {
          ethereum.removeListener('accountsChanged', refresh)
          ethereum.removeListener('chainChanged', refresh)
        } catch {
          // ignore
        }
      }
    }
  }, [refresh])

  return { address, isConnected, chainId, refresh }
}
