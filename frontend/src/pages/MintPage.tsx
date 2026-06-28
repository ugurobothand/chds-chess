import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, CHESS_PASS_ABI } from '../constants/contracts'
import { toast } from '../components/Toast'
import { useDirectWallet } from '../hooks/useDirectWallet'
import { useDevMode } from '../hooks/useDevMode'
import { devWriteContract } from '../hooks/sendDevTx'

export default function MintPage() {
  const { address, isConnected } = useDirectWallet()
  const { isDevMode, accountIndex } = useDevMode()
  const navigate = useNavigate()
  const [devBusy, setDevBusy] = useState(false)

  const { data: hasPass, refetch: refetchPass } = useReadContract({
    address: CONTRACT_ADDRESSES.ChessPass,
    abi: CHESS_PASS_ABI,
    functionName: 'hasPass',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !isDevMode },
  })

  const devAddresses: `0x${string}`[] = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93B906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  ]

  const { data: hasPassDev } = useReadContract({
    address: CONTRACT_ADDRESSES.ChessPass,
    abi: CHESS_PASS_ABI,
    functionName: 'hasPass',
    args: isDevMode && accountIndex !== null ? [devAddresses[accountIndex]] : undefined,
    query: { enabled: isDevMode && accountIndex !== null, refetchInterval: 3000 },
  })

  const effectiveHasPass = isDevMode ? hasPassDev : hasPass

  const { data: remaining } = useReadContract({
    address: CONTRACT_ADDRESSES.ChessPass,
    abi: CHESS_PASS_ABI,
    functionName: 'remainingSupply',
    query: { refetchInterval: 30_000 },
  })

  const {
    writeContract, data: hash,
    isPending, error: mintError,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Pass minted! Welcome to the game.')
      refetchPass()
    }
  }, [isSuccess, refetchPass])

  useEffect(() => {
    if (!mintError) return
    const msg = mintError.message
    toast.error(
      msg.includes('AlreadyHasPass')   ? 'You already own a pass' :
      msg.includes('MaxSupplyReached') ? 'All 10,000 passes have been minted' :
      msg.includes('InsufficientPayment') ? 'Insufficient ETH — need 0.01 ETH' :
      'Mint failed. Please try again.'
    )
  }, [mintError])

  async function handleDevMint() {
    if (accountIndex === null) return
    setDevBusy(true)
    try {
      await devWriteContract({
        accountIndex,
        address: CONTRACT_ADDRESSES.ChessPass,
        abi: CHESS_PASS_ABI,
        functionName: 'mint',
        value: BigInt('10000000000000000'),
      })
      toast.success('Pass minted! Reloading…')
      setTimeout(() => window.location.reload(), 2000)
    } catch (e: any) {
      toast.error(e?.message || 'Mint failed')
    } finally {
      setDevBusy(false)
    }
  }

  const isBusy = isPending || isConfirming || devBusy
  const canMint = (isConnected || isDevMode) && !effectiveHasPass

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <h1 className="text-3xl font-bold mb-2">Chess Pass</h1>
      <p className="text-gray-400 mb-8">
        Soulbound NFT pass — required to play. Only 10,000 exist. Non-transferable.
      </p>

      <div className="bg-gray-800 rounded-xl p-8 mb-6 space-y-5">
        {/* Icon */}
        <div className="text-6xl">♟</div>

        {/* Supply */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Remaining</div>
          <div className="text-3xl font-bold">
            {remaining !== undefined ? remaining.toString() : '…'}
            <span className="text-lg text-gray-400 font-normal"> / 10,000</span>
          </div>
          {remaining !== undefined && (
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${(Number(remaining) / 10_000) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Price</div>
          <div className="text-2xl font-semibold">0.01 ETH</div>
        </div>

        {/* Action area */}
        {!isConnected && !isDevMode && (
          <p className="text-yellow-400 text-sm">Connect your wallet or select Dev Mode to mint</p>
        )}

        {effectiveHasPass && (
          <div className="space-y-2">
            <p className="text-green-400 font-semibold text-lg">You own a Chess Pass ✓</p>
            <button
              onClick={() => navigate('/lobby')}
              className="mt-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400
                text-black font-bold rounded-lg text-sm"
            >
              Go to Lobby →
            </button>
          </div>
        )}

        {canMint && (
          <button
            onClick={isDevMode ? handleDevMint : () => writeContract({
              address: CONTRACT_ADDRESSES.ChessPass,
              abi: CHESS_PASS_ABI,
              functionName: 'mint',
              value: BigInt('10000000000000000'),
            })}
            disabled={isBusy}
            className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400
              text-black font-bold disabled:opacity-50 transition-colors"
          >
            {isPending    ? 'Confirm in wallet…' :
             isConfirming ? 'Minting…' :
             devBusy      ? 'Minting…' :
             'Mint Pass — 0.01 ETH'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Each wallet can hold only one pass. Passes cannot be transferred or sold.
      </p>
    </div>
  )
}
