import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, CHINESE_CHESS_ABI } from '../constants/contracts'
import { toast } from './Toast'

// ─── Piece map ────────────────────────────────────────────────────────────────

// Standard English abbreviations for Chinese Chess pieces
// K=General  A=Advisor  E=Elephant  H=Horse  R=Rook  C=Cannon  S=Soldier
const PIECES: Record<number, { char: string; red: boolean }> = {
  1:  { char: 'K', red: true  },
  2:  { char: 'A', red: true  },
  3:  { char: 'E', red: true  },
  4:  { char: 'H', red: true  },
  5:  { char: 'R', red: true  },
  6:  { char: 'C', red: true  },
  7:  { char: 'S', red: true  },
  11: { char: 'K', red: false },
  12: { char: 'A', red: false },
  13: { char: 'E', red: false },
  14: { char: 'H', red: false },
  15: { char: 'R', red: false },
  16: { char: 'C', red: false },
  17: { char: 'S', red: false },
}

function moveErrorMessage(message: string) {
  return message.includes('InvalidMove') || message.includes('0x87822d34')
    ? 'Invalid move - try another square'
    : message.includes('NotYourTurn') || message.includes('0x6f5c3167')
      ? 'Not your turn'
      : message.includes('GameNotActive')
        ? 'Game is not active'
        : message.includes('SessionKeyExpired')
          ? 'Session key expired'
          : 'Move failed'
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChessBoardProps {
  gameId:       bigint
  board:        readonly number[]
  isMyTurn:     boolean
  isRedPlayer:  boolean
  gameActive:   boolean
  onMoveSuccess: () => void
  isSessionKeyEnabled?: boolean
  submitMoveWithSessionKey?: (fromPos: number, toPos: number) => Promise<`0x${string}`>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChessBoard({
  gameId, board, isMyTurn, isRedPlayer, gameActive, onMoveSuccess,
  isSessionKeyEnabled = false, submitMoveWithSessionKey,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [sessionHash, setSessionHash] = useState<`0x${string}` | undefined>()
  const [isSessionSubmitting, setIsSessionSubmitting] = useState(false)

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const activeHash = sessionHash ?? hash
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: activeHash })

  useEffect(() => {
    if (isSuccess) {
      setSelected(null)
      setSessionHash(undefined)
      setIsSessionSubmitting(false)
      toast.success('Move confirmed!')
      onMoveSuccess()
    }
  }, [isSuccess, onMoveSuccess])

  useEffect(() => {
    if (!writeError) return
    toast.error(moveErrorMessage(writeError.message))
    setSelected(null)
  }, [writeError])

  async function handleCell(pos: number) {
    if (!gameActive || !isMyTurn || isPending || isConfirming || isSessionSubmitting) return
    const piece = board[pos]
    const mine = isRedPlayer
      ? (piece >= 1 && piece <= 7)
      : (piece >= 11 && piece <= 17)

    if (selected === null) {
      if (mine) setSelected(pos)
      return
    }
    if (pos === selected)   { setSelected(null); return }
    if (mine)               { setSelected(pos);  return }

    if (isSessionKeyEnabled && submitMoveWithSessionKey) {
      setIsSessionSubmitting(true)
      try {
        const nextHash = await submitMoveWithSessionKey(selected, pos)
        setSessionHash(nextHash)
      } catch (err: any) {
        toast.error(moveErrorMessage(err?.message || ''))
        setIsSessionSubmitting(false)
      }
    } else {
      writeContract({
        address: CONTRACT_ADDRESSES.ChineseChess,
        abi: CHINESE_CHESS_ABI,
        functionName: 'submitMove',
        args: [gameId, selected, pos],
      })
    }
    setSelected(null)
  }

  const busy = isPending || isConfirming || isSessionSubmitting

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Turn badge */}
      <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
        busy         ? 'bg-yellow-700 text-yellow-100' :
        isMyTurn     ? 'bg-green-700  text-green-100'  :
                       'bg-gray-700   text-gray-300'
      }`}>
        {busy
          ? (isPending ? 'Waiting for wallet…' : isSessionSubmitting && !sessionHash ? 'Submitting session move…' : 'Confirming on chain…')
          : isMyTurn ? 'Your turn' : "Opponent's turn"}
      </div>

      {/* Board */}
      <div className={`relative border-2 border-amber-800 rounded bg-amber-100
        ${busy ? 'opacity-60 pointer-events-none' : ''}`}>

        {Array.from({ length: 10 }, (_, row) => (
          <div key={row}>

            {/* River separator between rows 4 and 5 */}
            {row === 5 && (
              <div className="flex items-center justify-center
                py-1 bg-blue-950/20 border-y border-blue-400/40
                text-blue-500 text-xs font-bold tracking-widest select-none">
                <span>— RIVER —</span>
              </div>
            )}

            {/* Row of 9 cells */}
            <div className="flex">
              {Array.from({ length: 9 }, (_, col) => {
                const pos   = row * 9 + col
                const piece = board[pos]
                const info  = PIECES[piece]
                const isSel = selected === pos
                const mine  = piece > 0 && (isRedPlayer
                  ? (piece >= 1 && piece <= 7)
                  : (piece >= 11 && piece <= 17))

                return (
                  <div
                    key={col}
                    onClick={() => handleCell(pos)}
                    className={[
                      'w-9 h-9 sm:w-11 sm:h-11',
                      'flex items-center justify-center',
                      'border border-amber-700/60',
                      isSel            ? 'bg-yellow-300'  :
                      mine && isMyTurn ? 'hover:bg-amber-200 cursor-pointer' :
                                         'cursor-default',
                    ].join(' ')}
                  >
                    {info && (
                      <div className={[
                        'w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2',
                        'flex items-center justify-center',
                        'font-bold text-xs sm:text-base leading-none select-none',
                        info.red
                          ? 'bg-amber-50 border-red-600 text-red-600'
                          : 'bg-amber-50 border-gray-900 text-gray-900',
                        isSel ? 'ring-2 ring-yellow-500 ring-offset-1' : '',
                      ].join(' ')}>
                        {info.char}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Busy overlay */}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center
            bg-black/20 rounded pointer-events-none">
            <span className="bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full">
              {isPending ? 'Confirm in wallet…' : isSessionSubmitting && !sessionHash ? 'Submitting…' : 'Waiting for Arbitrum…'}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {isRedPlayer ? 'You are Red (bottom ↓)' : 'You are Black (top ↑)'}
      </p>
    </div>
  )
}
