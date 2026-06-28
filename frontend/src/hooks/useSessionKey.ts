import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
} from 'viem'
import { hardhat } from 'viem/chains'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'

const SESSION_KEY_DURATION_SECONDS = 30 * 60
const SESSION_KEY_GAS_FLOAT = parseEther('0.02')

const SESSION_KEY_ABI = [
  {
    type: 'function',
    name: 'authorizeSessionKey',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sessionKey', type: 'address' },
      { name: 'gameId', type: 'uint256' },
      { name: 'expiresAt', type: 'uint64' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'revokeSessionKey',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'sessionKey', type: 'address' }],
    outputs: [],
  },
] as const

type StoredSessionKey = {
  privateKey: `0x${string}`
  address: `0x${string}`
  player: `0x${string}`
  gameId: string
  expiresAt: number
}

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
})

function storageKey(gameId: bigint, player?: string) {
  return `chds:session-key:${gameId.toString()}:${player?.toLowerCase() ?? 'none'}`
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

export function useSessionKey(gameId: bigint, player?: `0x${string}`) {
  const key = useMemo(() => storageKey(gameId, player), [gameId, player])
  const [session, setSession] = useState<StoredSessionKey | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    if (!player) {
      setSession(null)
      return
    }

    const raw = sessionStorage.getItem(key)
    if (!raw) {
      setSession(null)
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredSessionKey
      const valid =
        parsed.player.toLowerCase() === player.toLowerCase() &&
        parsed.gameId === gameId.toString() &&
        parsed.expiresAt > nowSeconds()
      if (valid) setSession(parsed)
      else {
        sessionStorage.removeItem(key)
        setSession(null)
      }
    } catch {
      sessionStorage.removeItem(key)
      setSession(null)
    }
  }, [gameId, key, player])

  const enableSessionKey = useCallback(async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum || !player) throw new Error('Connect MetaMask first')

    setIsBusy(true)
    try {
      const privateKey = generatePrivateKey()
      const account = privateKeyToAccount(privateKey)
      const expiresAt = nowSeconds() + SESSION_KEY_DURATION_SECONDS
      const sessionAddress = account.address

      const authorizeData = encodeFunctionData({
        abi: SESSION_KEY_ABI,
        functionName: 'authorizeSessionKey',
        args: [sessionAddress, gameId, BigInt(expiresAt)],
      })

      const authorizeHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: player,
          to: CONTRACT_ADDRESSES.ChineseChess,
          data: authorizeData,
        }],
      })
      await publicClient.waitForTransactionReceipt({ hash: authorizeHash })

      const fundHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: player,
          to: sessionAddress,
          value: `0x${SESSION_KEY_GAS_FLOAT.toString(16)}`,
        }],
      })
      await publicClient.waitForTransactionReceipt({ hash: fundHash })

      const nextSession: StoredSessionKey = {
        privateKey,
        address: sessionAddress,
        player,
        gameId: gameId.toString(),
        expiresAt,
      }
      sessionStorage.setItem(key, JSON.stringify(nextSession))
      setSession(nextSession)
      return nextSession
    } finally {
      setIsBusy(false)
    }
  }, [gameId, key, player])

  const revokeSessionKey = useCallback(async () => {
    const ethereum = (window as any).ethereum
    if (!ethereum || !player || !session) return

    setIsBusy(true)
    try {
      const revokeData = encodeFunctionData({
        abi: SESSION_KEY_ABI,
        functionName: 'revokeSessionKey',
        args: [session.address],
      })
      const hash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: player,
          to: CONTRACT_ADDRESSES.ChineseChess,
          data: revokeData,
        }],
      })
      await publicClient.waitForTransactionReceipt({ hash })
    } finally {
      sessionStorage.removeItem(key)
      setSession(null)
      setIsBusy(false)
    }
  }, [key, player, session])

  const submitMoveWithSessionKey = useCallback(async (fromPos: number, toPos: number) => {
    if (!session) throw new Error('Session key is not enabled')
    if (session.expiresAt <= nowSeconds()) {
      sessionStorage.removeItem(key)
      setSession(null)
      throw new Error('Session key expired')
    }

    const account = privateKeyToAccount(session.privateKey)
    const client = createWalletClient({
      account,
      chain: hardhat,
      transport: http('http://127.0.0.1:8545'),
    })

    return client.writeContract({
      address: CONTRACT_ADDRESSES.ChineseChess,
      abi: CHINESE_CHESS_ABI,
      functionName: 'submitMove',
      args: [gameId, fromPos, toPos],
    })
  }, [gameId, key, session])

  return {
    sessionKeyAddress: session?.address,
    expiresAt: session?.expiresAt,
    isSessionKeyEnabled: !!session && session.expiresAt > nowSeconds(),
    isBusy,
    enableSessionKey,
    revokeSessionKey,
    submitMoveWithSessionKey,
  }
}
