import { useParams } from 'react-router-dom'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect } from 'react'
import { useDirectWallet } from '../hooks/useDirectWallet'
import ChessBoard from '../components/ChessBoard'
import PieceLegend from '../components/PieceLegend'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'
import { toast } from '../components/Toast'

const STATUS_LABEL = ['Waiting', 'Active', 'Finished', 'Draw']
const WINNER_LABEL = ['—', 'Red (Player 1)', 'Black (Player 2)']

export default function GamePage() {
  const { gameId: gameIdStr } = useParams<{ gameId: string }>()
  const gameId = BigInt(gameIdStr ?? '0')
  const { address } = useDirectWallet()

  // ─── Fetch board + game state (auto-refresh every 5s) ───────────────────────
  const { data: board, refetch: refetchBoard } = useReadContract({
    address: CONTRACT_ADDRESSES.ChineseChess,
    abi: CHINESE_CHESS_ABI,
    functionName: 'getBoard',
    args: [gameId],
    query: { refetchInterval: 5000 },
  })

  const { data: game, refetch: refetchGame } = useReadContract({
    address: CONTRACT_ADDRESSES.ChineseChess,
    abi: CHINESE_CHESS_ABI,
    functionName: 'getGame',
    args: [gameId],
    query: { refetchInterval: 5000 },
  })

  function refetchAll() {
    refetchBoard()
    refetchGame()
  }

  type GameObject = {
    player1: `0x${string}`; player2: `0x${string}`; isPlayer1Turn: boolean
    status: number; winner: number; wager: bigint; moveCount: bigint
  }
  type GameTuple = readonly [`0x${string}`, `0x${string}`, boolean, number, number, bigint, bigint]
  const g = game as GameObject | GameTuple | undefined
  const gameTuple = Array.isArray(g) ? g as GameTuple : undefined
  const gameObject = g && !Array.isArray(g) ? g as GameObject : undefined
  const player1 = gameTuple?.[0] ?? gameObject?.player1
  const player2 = gameTuple?.[1] ?? gameObject?.player2
  const isPlayer1Turn = gameTuple?.[2] ?? gameObject?.isPlayer1Turn
  const status = gameTuple?.[3] ?? gameObject?.status
  const winner = gameTuple?.[4] ?? gameObject?.winner
  const wager = gameTuple?.[5] ?? gameObject?.wager
  const moveCount = gameTuple?.[6] ?? gameObject?.moveCount

  const isRedPlayer = address?.toLowerCase() === player1?.toLowerCase()
  const isBlackPlayer = address?.toLowerCase() === player2?.toLowerCase()
  const isMyTurn = (isRedPlayer && !!isPlayer1Turn) || (isBlackPlayer && !isPlayer1Turn)
  const gameActive = status === 1
  const gameFinished = status === 2 || status === 3

  // ─── Resign ──────────────────────────────────────────────────────────────────
  const { writeContract: writeResign, data: resignHash, isPending: isResigning, error: resignError } = useWriteContract()
  const { isSuccess: resignSuccess } = useWaitForTransactionReceipt({ hash: resignHash })

  useEffect(() => { if (resignSuccess) { toast.info('You resigned.'); refetchAll() } }, [resignSuccess])
  useEffect(() => { if (resignError) toast.error('Resign failed') }, [resignError])

  // ─── Claim Timeout ───────────────────────────────────────────────────────────
  const { writeContract: writeTimeout, data: timeoutHash, isPending: isClaimingTimeout, error: timeoutError } = useWriteContract()
  const { isSuccess: timeoutSuccess } = useWaitForTransactionReceipt({ hash: timeoutHash })

  useEffect(() => { if (timeoutSuccess) { toast.success('Timeout claimed! You win.'); refetchAll() } }, [timeoutSuccess])
  useEffect(() => { if (timeoutError) toast.error('Timeout not reached yet') }, [timeoutError])

  if (!address) {
    return <div className="text-center py-20 text-gray-400">Connect your wallet to view this game.</div>
  }

  if (!board || !game) {
    return <div className="text-center py-20 text-gray-400">Loading game…</div>
  }

  if (!isRedPlayer && !isBlackPlayer) {
    return <div className="text-center py-20 text-gray-400">You are not a player in this game.</div>
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Game info bar */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 text-sm">
        <div>
          <span className="text-gray-400">Game </span>
          <span className="font-mono">#{gameIdStr}</span>
        </div>
        <div>
          <span className="text-gray-400">Wager: </span>
          <span>{wager ? (formatEther(wager) === '0' ? 'Free' : `${formatEther(wager)} ETH`) : '—'}</span>
        </div>
        <div>
          <span className="text-gray-400">Moves: </span>
          <span>{moveCount?.toString() ?? '0'}</span>
        </div>
        <div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
            gameActive ? 'bg-green-700' : gameFinished ? 'bg-gray-600' : 'bg-yellow-700'
          }`}>
            {STATUS_LABEL[status ?? 0]}
          </span>
        </div>
      </div>

      {/* Game over banner */}
      {gameFinished && (
        <div className="bg-amber-900 border border-amber-600 rounded-xl px-4 py-4 text-center">
          <p className="text-lg font-bold">
            {status === 3
              ? 'Draw'
              : winner === (isRedPlayer ? 1 : 2)
                ? '🏆 You win!'
                : '❌ You lost'}
          </p>
          {status === 2 && (
            <p className="text-sm text-gray-300 mt-1">Winner: {WINNER_LABEL[winner ?? 0]}</p>
          )}
          {!!wager && wager > 0n && winner === (isRedPlayer ? 1 : 2) && (
            <p className="text-sm text-green-400 mt-1">
              {formatEther(wager * 2n)} ETH sent to your wallet
            </p>
          )}
        </div>
      )}

      {/* Chess board */}
      <ChessBoard
        gameId={gameId}
        board={board as readonly number[]}
        isMyTurn={isMyTurn}
        isRedPlayer={isRedPlayer}
        gameActive={gameActive}
        onMoveSuccess={refetchAll}
      />

      {/* Piece legend */}
      <PieceLegend />

      {/* Controls */}
      {gameActive && (
        <div className="flex gap-3">
          <button
            onClick={() => writeResign({
              address: CONTRACT_ADDRESSES.ChineseChess,
              abi: CHINESE_CHESS_ABI,
              functionName: 'resign',
              args: [gameId],
            })}
            disabled={isResigning}
            className="flex-1 py-2 rounded border border-gray-600 hover:border-red-400
              hover:text-red-400 text-sm disabled:opacity-40"
          >
            {isResigning ? 'Resigning…' : 'Resign'}
          </button>
          <button
            onClick={() => writeTimeout({
              address: CONTRACT_ADDRESSES.ChineseChess,
              abi: CHINESE_CHESS_ABI,
              functionName: 'claimTimeout',
              args: [gameId],
            })}
            disabled={isClaimingTimeout || isMyTurn}
            className="flex-1 py-2 rounded border border-gray-600 hover:border-yellow-400
              hover:text-yellow-400 text-sm disabled:opacity-40"
            title={isMyTurn ? "Can't claim timeout on your own turn" : 'Claim win if opponent has been idle 10+ min'}
          >
            {isClaimingTimeout ? 'Claiming…' : 'Claim Timeout'}
          </button>
        </div>
      )}
    </div>
  )
}
