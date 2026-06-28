import { useState, useEffect } from 'react'
import { usePublicClient, useReadContracts } from 'wagmi'
import { parseAbiItem } from 'viem'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'

interface PlayerEntry {
  address: string
  wins: bigint
  losses: bigint
}

export default function LeaderboardPage() {
  const client = usePublicClient()
  const [winners, setWinners] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch historical GameFinished events
  useEffect(() => {
    if (!client) return

    // Use a recent block window to avoid RPC range limits.
    // For mainnet, set VITE_CONTRACT_DEPLOY_BLOCK in .env to the actual deployment block.
    const deployBlock = BigInt(import.meta.env.VITE_CONTRACT_DEPLOY_BLOCK || '0')

    client.getLogs({
      address: CONTRACT_ADDRESSES.ChineseChess,
      event: parseAbiItem('event GameFinished(uint256 indexed gameId, uint8 winner, address winnerAddress)'),
      fromBlock: deployBlock,
    })
      .then(logs => {
        const addrs = [...new Set(logs.map(l => (l.args as { winnerAddress: string }).winnerAddress.toLowerCase()))]
        setWinners(addrs)
      })
      .catch(() => setWinners([]))
      .finally(() => setLoading(false))
  }, [client])

  // Batch-read wins + losses for all known winners
  const contracts = winners.flatMap(addr => [
    {
      address: CONTRACT_ADDRESSES.ChineseChess,
      abi: CHINESE_CHESS_ABI,
      functionName: 'wins' as const,
      args: [addr as `0x${string}`],
    },
    {
      address: CONTRACT_ADDRESSES.ChineseChess,
      abi: CHINESE_CHESS_ABI,
      functionName: 'losses' as const,
      args: [addr as `0x${string}`],
    },
  ])

  const { data: statsData } = useReadContracts({ contracts, query: { enabled: winners.length > 0 } })

  const entries: PlayerEntry[] = winners.map((addr, i) => ({
    address: addr,
    wins:   (statsData?.[i * 2]?.result as bigint | undefined)   ?? 0n,
    losses: (statsData?.[i * 2 + 1]?.result as bigint | undefined) ?? 0n,
  })).sort((a, b) => (b.wins > a.wins ? 1 : b.wins < a.wins ? -1 : 0))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
      <p className="text-xs text-gray-500 mb-6">
        Rankings based on on-chain game results. Updates live as games finish.
      </p>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-right px-4 py-3">Wins</th>
              <th className="text-right px-4 py-3">Losses</th>
              <th className="text-right px-4 py-3">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  Loading on-chain data…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-10">
                  No games finished yet. Leaderboard populates as games complete.
                </td>
              </tr>
            ) : (
              entries.map((e, i) => {
                const total = e.wins + e.losses
                const rate = total > 0n ? Math.round(Number((e.wins * 100n) / total)) : 0
                return (
                  <tr key={e.address} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono">
                      {e.address.slice(0, 6)}…{e.address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">{e.wins.toString()}</td>
                    <td className="px-4 py-3 text-right text-red-400">{e.losses.toString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{rate}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
