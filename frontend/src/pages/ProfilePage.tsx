import { useReadContract } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { CONTRACT_ADDRESSES, CHESS_PASS_ABI, CHINESE_CHESS_ABI } from '../constants/contracts'
import { useDirectWallet } from '../hooks/useDirectWallet'

export default function ProfilePage() {
  const { address, isConnected } = useDirectWallet()
  const navigate = useNavigate()

  const { data: hasPass } = useReadContract({
    address: CONTRACT_ADDRESSES.ChessPass,
    abi: CHESS_PASS_ABI,
    functionName: 'hasPass',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  })

  const { data: wins } = useReadContract({
    address: CONTRACT_ADDRESSES.ChineseChess,
    abi: CHINESE_CHESS_ABI,
    functionName: 'wins',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  })

  const { data: losses } = useReadContract({
    address: CONTRACT_ADDRESSES.ChineseChess,
    abi: CHINESE_CHESS_ABI,
    functionName: 'losses',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  })

  if (!isConnected) {
    return (
      <div className="text-center mt-20 text-gray-400">
        Connect your wallet to view your profile.
      </div>
    )
  }

  const w = wins   ? Number(wins)   : 0
  const l = losses ? Number(losses) : 0
  const total = w + l
  const winRate = total > 0 ? Math.round((w / total) * 100) : null

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Wallet */}
      <div className="bg-gray-800 rounded-xl p-5">
        <div className="text-xs text-gray-400 mb-1">Wallet</div>
        <div className="font-mono text-sm break-all">{address}</div>
      </div>

      {/* Pass status */}
      <div className="bg-gray-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-1">Chess Pass</div>
          {hasPass
            ? <div className="text-green-400 font-semibold">Owned ✓</div>
            : <div className="text-red-400 font-semibold">Not owned</div>
          }
          <div className="text-xs text-gray-500 mt-1">ERC-721 Soulbound NFT</div>
        </div>
        {!hasPass && (
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black
              font-semibold rounded-lg text-sm"
          >
            Mint Pass
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-5">
        <div className="text-xs text-gray-400 mb-4">Game Record</div>
        <div className="flex gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{w}</div>
            <div className="text-xs text-gray-400 mt-1">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{l}</div>
            <div className="text-xs text-gray-400 mt-1">Losses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {winRate !== null ? `${winRate}%` : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-300">{total}</div>
            <div className="text-xs text-gray-400 mt-1">Total</div>
          </div>
        </div>

        {/* Win rate bar */}
        {total > 0 && (
          <div className="h-2 bg-red-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${winRate}%` }}
            />
          </div>
        )}
      </div>

      {/* Play button */}
      {hasPass && (
        <button
          onClick={() => navigate('/lobby')}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black
            font-bold rounded-xl"
        >
          Find a Game →
        </button>
      )}
    </div>
  )
}
