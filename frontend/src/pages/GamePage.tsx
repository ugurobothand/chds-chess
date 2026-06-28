import { useParams } from 'react-router-dom'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { useEffect } from 'react'
import { useDirectWallet } from '../hooks/useDirectWallet'
import ChessBoard from '../components/ChessBoard'
import PieceLegend from '../components/PieceLegend'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'
import { toast } from '../components/Toast'
import { useSessionKey } from '../hooks/useSessionKey'
import { useLastGame } from '../hooks/useLastGame'
import { useLanguage } from '../i18n'

export default function GamePage() {
  const { gameId: gameIdStr } = useParams<{ gameId: string }>()
  const gameId = BigInt(gameIdStr ?? '0')
  const { address } = useDirectWallet()
  const { saveGameId } = useLastGame()
  const { t } = useLanguage()

  useEffect(() => {
    if (gameIdStr !== undefined) saveGameId(gameIdStr)
  }, [gameIdStr, saveGameId])

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
  const {
    sessionKeyAddress,
    expiresAt,
    isSessionKeyEnabled,
    isBusy: isSessionKeyBusy,
    enableSessionKey,
    revokeSessionKey,
    submitMoveWithSessionKey,
  } = useSessionKey(gameId, (isRedPlayer || isBlackPlayer) ? address as `0x${string}` : undefined)

  // ─── Resign ──────────────────────────────────────────────────────────────────
  const { writeContract: writeResign, data: resignHash, isPending: isResigning, error: resignError } = useWriteContract()
  const { isSuccess: resignSuccess } = useWaitForTransactionReceipt({ hash: resignHash })

  useEffect(() => { if (resignSuccess) { toast.info(t.game.errors.resigned); refetchAll() } }, [resignSuccess])
  useEffect(() => { if (resignError) toast.error(t.game.errors.resignFailed) }, [resignError])

  // ─── Claim Timeout ───────────────────────────────────────────────────────────
  const { writeContract: writeTimeout, data: timeoutHash, isPending: isClaimingTimeout, error: timeoutError } = useWriteContract()
  const { isSuccess: timeoutSuccess } = useWaitForTransactionReceipt({ hash: timeoutHash })

  useEffect(() => { if (timeoutSuccess) { toast.success(t.game.errors.timeoutClaimed); refetchAll() } }, [timeoutSuccess])
  useEffect(() => { if (timeoutError) toast.error(t.game.errors.timeoutNotReached) }, [timeoutError])

  if (!address) {
    return <div className="text-center py-20 text-gray-400">{t.game.labels.connectWallet}</div>
  }

  if (!board || !game) {
    return <div className="text-center py-20 text-gray-400">{t.game.labels.loading}</div>
  }

  if (!isRedPlayer && !isBlackPlayer) {
    return <div className="text-center py-20 text-gray-400">{t.game.labels.notPlayer}</div>
  }

  const statusLabel = [
    t.game.labels.waiting,
    t.game.labels.active,
    t.game.labels.finished,
    t.game.labels.draw,
  ]
  const winnerLabel = ['—', t.game.labels.redPlayer, t.game.labels.blackPlayer]

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Game info bar */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 text-sm">
        <div>
          <span className="text-gray-400">{t.game.labels.game} </span>
          <span className="font-mono">#{gameIdStr}</span>
        </div>
        <div>
          <span className="text-gray-400">{t.game.labels.wager}: </span>
          <span>{wager ? (formatEther(wager) === '0' ? t.game.labels.free : `${formatEther(wager)} ETH`) : '—'}</span>
        </div>
        <div>
          <span className="text-gray-400">{t.game.labels.moves}: </span>
          <span>{moveCount?.toString() ?? '0'}</span>
        </div>
        <div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
            gameActive ? 'bg-green-700' : gameFinished ? 'bg-gray-600' : 'bg-yellow-700'
          }`}>
            {statusLabel[status ?? 0]}
          </span>
        </div>
      </div>

      {/* Game over banner */}
      {gameFinished && (
        <div className="bg-amber-900 border border-amber-600 rounded-xl px-4 py-4 text-center">
          <p className="text-lg font-bold">
            {status === 3
              ? t.game.labels.draw
              : winner === (isRedPlayer ? 1 : 2)
                ? t.game.labels.youWin
                : t.game.labels.youLost}
          </p>
          {status === 2 && (
            <p className="text-sm text-gray-300 mt-1">{t.game.labels.winner}: {winnerLabel[winner ?? 0]}</p>
          )}
          {!!wager && wager > 0n && winner === (isRedPlayer ? 1 : 2) && (
            <p className="text-sm text-green-400 mt-1">
              {formatEther(wager * 2n)} {t.game.labels.ethSent}
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
        isSessionKeyEnabled={isSessionKeyEnabled}
        submitMoveWithSessionKey={submitMoveWithSessionKey}
      />

      {/* Piece legend */}
      <PieceLegend />

      {gameActive && (
        <div className="bg-gray-800 rounded-xl px-4 py-3 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{t.game.labels.sessionKey}</div>
              <div className="text-xs text-gray-400">
                {isSessionKeyEnabled && sessionKeyAddress
                  ? `${t.game.labels.autoMovesEnabledUntil} ${new Date((expiresAt ?? 0) * 1000).toLocaleTimeString()}`
                  : t.game.labels.authorizeSessionKey}
              </div>
              {sessionKeyAddress && (
                <div className="font-mono text-xs text-gray-500 mt-1">
                  {sessionKeyAddress.slice(0, 6)}…{sessionKeyAddress.slice(-4)}
                </div>
              )}
            </div>
            {isSessionKeyEnabled ? (
              <button
                onClick={() => revokeSessionKey().catch(() => toast.error(t.game.errors.revokeFailed))}
                disabled={isSessionKeyBusy}
                className="px-3 py-1 rounded border border-gray-600 hover:border-red-400 hover:text-red-400 disabled:opacity-40"
              >
                {isSessionKeyBusy ? t.game.labels.revoking : t.game.labels.revoke}
              </button>
            ) : (
              <button
                onClick={() => enableSessionKey()
                  .then(() => toast.success('Session key enabled'))
                  .catch((err) => toast.error(err?.message || t.game.errors.sessionKeyFailed))}
                disabled={isSessionKeyBusy}
                className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold"
              >
                {isSessionKeyBusy ? t.game.labels.authorizing : t.game.labels.enableAutoMoves}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {t.game.labels.sessionKeyNote}
          </p>
        </div>
      )}

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
            {isResigning ? t.game.labels.resigning : t.game.labels.resign}
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
            title={isMyTurn ? t.game.labels.cannotClaimOwnTurn : t.game.labels.claimIfIdle}
          >
            {isClaimingTimeout ? t.game.labels.claiming : t.game.labels.claimTimeout}
          </button>
        </div>
      )}
    </div>
  )
}
