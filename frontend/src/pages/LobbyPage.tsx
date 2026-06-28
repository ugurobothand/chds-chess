import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, parseEventLogs } from 'viem'
import { CONTRACT_ADDRESSES, CHESS_LOBBY_ABI } from '../constants/contracts'
import { toast } from '../components/Toast'
import { useDirectWallet } from '../hooks/useDirectWallet'
import { useDevMode } from '../hooks/useDevMode'
import { devWriteContract } from '../hooks/sendDevTx'

const DEV_ACCOUNTS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  '0x90F79bf6EB2c4f870365E785982E1f101E93B906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
]

export default function LobbyPage() {
  const navigate = useNavigate()
  const { address, isConnected } = useDirectWallet()
  const { isDevMode, accountIndex } = useDevMode()
  const [showCreate, setShowCreate] = useState(false)
  const [wagerInput, setWagerInput] = useState('0')
  const [devBusy, setDevBusy] = useState(false)

  const effectiveAddress = isDevMode && accountIndex !== null
    ? DEV_ACCOUNTS[accountIndex]
    : address

  const { data: openGamesData, refetch: refetchGames } = useReadContract({
    address: CONTRACT_ADDRESSES.ChessLobby,
    abi: CHESS_LOBBY_ABI,
    functionName: 'getOpenGames',
    query: { refetchInterval: 5000 },
  })

  type OpenGamesResult = {
    ids: bigint[]
    gamesList: { player: string; wager: bigint; createdAt: bigint; active: boolean }[]
  }
  const lobbyResult = openGamesData as OpenGamesResult | undefined
  const gameIds = lobbyResult?.ids ?? []
  const gamesList = lobbyResult?.gamesList ?? []

  const { writeContract: writeList, data: listHash, isPending: isListing, error: listError } = useWriteContract()
  const { isLoading: isListConfirming, isSuccess: isListSuccess } = useWaitForTransactionReceipt({ hash: listHash })

  useEffect(() => {
    if (isListSuccess) { toast.success('Game listed!'); setShowCreate(false); refetchGames() }
  }, [isListSuccess, refetchGames])

  useEffect(() => {
    if (listError) toast.error('Failed: ' + (listError as Error).message.slice(0, 80))
  }, [listError])

  async function handleDevCreate() {
    if (accountIndex === null) return
    setDevBusy(true)
    try {
      const wagerWei = parseEther(wagerInput || '0')
      await devWriteContract({
        accountIndex,
        address: CONTRACT_ADDRESSES.ChessLobby,
        abi: CHESS_LOBBY_ABI,
        functionName: 'listGame',
        args: [wagerWei],
        value: wagerWei,
      })
      toast.success('Game created!')
      setShowCreate(false)
      refetchGames()
    } catch (e: any) {
      toast.error(e?.message || 'Failed')
    } finally {
      setDevBusy(false)
    }
  }

  function handleCreate() {
    const wagerWei = parseEther(wagerInput || '0')
    writeList({ address: CONTRACT_ADDRESSES.ChessLobby, abi: CHESS_LOBBY_ABI, functionName: 'listGame', args: [wagerWei], value: wagerWei })
  }

  const { writeContract: writeJoin, data: joinHash, isPending: isJoining, error: joinError } = useWriteContract()
  const { isLoading: isJoinConfirming, data: joinReceipt } = useWaitForTransactionReceipt({ hash: joinHash })

  useEffect(() => {
    if (!joinReceipt) return
    try {
      const logs = parseEventLogs({ abi: CHESS_LOBBY_ABI, eventName: 'GameStarted', logs: joinReceipt.logs })
      if (logs.length > 0) {
        const gameId = (logs[0].args as { gameId: bigint }).gameId
        toast.success('Game started!')
        navigate(`/game/${gameId.toString()}`)
      }
    } catch {
      toast.error('Could not find game ID')
    }
  }, [joinReceipt, navigate])

  useEffect(() => {
    if (joinError) toast.error('Failed: ' + (joinError as Error).message.slice(0, 80))
  }, [joinError])

  async function handleDevJoin(listingId: bigint, wager: bigint) {
    if (accountIndex === null) return
    setDevBusy(true)
    try {
      await devWriteContract({
        accountIndex,
        address: CONTRACT_ADDRESSES.ChessLobby,
        abi: CHESS_LOBBY_ABI,
        functionName: 'joinGame',
        args: [listingId],
        value: wager,
      })
      toast.success('Joined! Reloading…')
      setTimeout(() => window.location.reload(), 2000)
    } catch (e: any) {
      toast.error(e?.message || 'Failed')
    } finally {
      setDevBusy(false)
    }
  }

  function handleJoin(listingId: bigint, wager: bigint) {
    writeJoin({ address: CONTRACT_ADDRESSES.ChessLobby, abi: CHESS_LOBBY_ABI, functionName: 'joinGame', args: [listingId], value: wager })
  }

  const { writeContract: writeCancel, data: cancelHash, isPending: isCancelling } = useWriteContract()
  const { isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash })

  useEffect(() => {
    if (isCancelSuccess) { toast.success('Cancelled'); refetchGames() }
  }, [isCancelSuccess, refetchGames])

  async function handleDevCancel(listingId: bigint) {
    if (accountIndex === null) return
    setDevBusy(true)
    try {
      await devWriteContract({
        accountIndex,
        address: CONTRACT_ADDRESSES.ChessLobby,
        abi: CHESS_LOBBY_ABI,
        functionName: 'cancelGame',
        args: [listingId],
      })
      toast.success('Cancelled!')
      refetchGames()
    } catch (e: any) {
      toast.error(e?.message || 'Failed')
    } finally {
      setDevBusy(false)
    }
  }

  function handleCancel(listingId: bigint) {
    writeCancel({ address: CONTRACT_ADDRESSES.ChessLobby, abi: CHESS_LOBBY_ABI, functionName: 'cancelGame', args: [listingId] })
  }

  const isBusy = isListing || isListConfirming || isJoining || isJoinConfirming || isCancelling || devBusy

  if (!isConnected && !isDevMode) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-gray-400">
        Connect your wallet or select Dev Mode to access the lobby.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Game Lobby</h1>
        <button onClick={() => setShowCreate(true)} disabled={isBusy}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-lg">
          + Create Game
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-gray-800 rounded-xl p-6 w-80 space-y-4">
            <h2 className="text-lg font-bold">Create Game</h2>
            <div>
              <label className="text-sm text-gray-400">Wager (ETH)</label>
              <input type="number" min="0" step="0.01" value={wagerInput}
                onChange={e => setWagerInput(e.target.value)}
                className="w-full mt-1 bg-gray-700 rounded px-3 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="0 = free game" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded border border-gray-600 hover:border-gray-400 text-sm">Cancel</button>
              <button onClick={isDevMode ? handleDevCreate : handleCreate} disabled={isListing || isListConfirming || devBusy}
                className="flex-1 py-2 rounded bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold text-sm">
                {isListing ? 'Confirm…' : isListConfirming ? 'Creating…' : devBusy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {gameIds.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No open games. Create one to start playing.</p>
        ) : (
          gameIds.map((id, i) => {
            const game = gamesList[i]
            if (!game) return null
            const isOwn = game.player.toLowerCase() === effectiveAddress?.toLowerCase()
            const wagerEth = formatEther(game.wager)
            return (
              <div key={id.toString()} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <p className="font-mono text-sm">
                    {game.player.slice(0, 6)}…{game.player.slice(-4)}
                    {isOwn && <span className="ml-2 text-xs text-yellow-400">(you)</span>}
                  </p>
                  <p className="text-sm text-gray-400">Wager: {wagerEth === '0' ? 'Free' : `${wagerEth} ETH`}</p>
                </div>
                <div className="flex gap-2">
                  {isOwn ? (
                    <button onClick={() => isDevMode ? handleDevCancel(id) : handleCancel(id)} disabled={isBusy}
                      className="px-3 py-1 text-sm rounded border border-gray-600 hover:border-red-400 hover:text-red-400 disabled:opacity-40">Cancel</button>
                  ) : (
                    <button onClick={() => isDevMode ? handleDevJoin(id, game.wager) : handleJoin(id, game.wager)} disabled={isBusy}
                      className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 font-semibold">
                      {isJoining || isJoinConfirming || devBusy ? 'Joining…' : 'Join'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isBusy && <p className="text-center text-yellow-400 text-sm mt-4">Transaction in progress…</p>}
    </div>
  )
}
