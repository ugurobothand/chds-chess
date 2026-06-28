import { useState, useEffect, useCallback } from 'react'

export function useDirectWallet() {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | undefined>(undefined)

  const refresh = useCallback(async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum) {
      setIsConnected(false)
      setAddress(undefined)
      return
    }
    try {
      const accounts: string[] = await ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        try {
          const cid: string = await ethereum.request({ method: 'eth_chainId' })
          setChainId(parseInt(cid, 16))
        } catch {
          // ignore chainId errors
        }
      } else {
        setIsConnected(false)
        setAddress(undefined)
      }
    } catch {
      setIsConnected(false)
      setAddress(undefined)
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
