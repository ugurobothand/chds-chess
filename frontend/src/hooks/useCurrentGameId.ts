import { useMemo } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'

type GameTuple = readonly [`0x${string}`, `0x${string}`, boolean, number, number, bigint, bigint]

export function useCurrentGameId(playerAddress?: string | null) {
  const normalizedPlayer = playerAddress?.toLowerCase() ?? null

  const { data: nextGameId } = useReadContract({
    address: CONTRACT_ADDRESSES.ChineseChess,
    abi: CHINESE_CHESS_ABI,
    functionName: 'nextGameId',
    query: { enabled: !!normalizedPlayer, refetchInterval: 5000 },
  })

  const gameContracts = useMemo(() => {
    const count = nextGameId ? Number(nextGameId) : 0
    if (!normalizedPlayer || count <= 0) return []

    return Array.from({ length: count }, (_, index) => ({
      address: CONTRACT_ADDRESSES.ChineseChess,
      abi: CHINESE_CHESS_ABI,
      functionName: 'getGame' as const,
      args: [BigInt(index)],
    }))
  }, [nextGameId, normalizedPlayer])

  const { data: games } = useReadContracts({
    contracts: gameContracts,
    query: { enabled: gameContracts.length > 0, refetchInterval: 5000 },
  })

  const activeGameId = useMemo(() => {
    if (!normalizedPlayer || !games) return null

    for (let index = games.length - 1; index >= 0; index--) {
      const result = games[index]?.result as GameTuple | undefined
      if (!result) continue

      const [player1, player2, , status] = result
      const isPlayer = player1.toLowerCase() === normalizedPlayer || player2.toLowerCase() === normalizedPlayer
      if (isPlayer && status === 1) {
        return index.toString()
      }
    }

    return null
  }, [games, normalizedPlayer])

  return { currentGameId: activeGameId }
}
