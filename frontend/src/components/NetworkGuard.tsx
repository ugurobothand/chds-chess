import { useChainId, useSwitchChain } from 'wagmi'
import { arbitrum, arbitrumSepolia, hardhat } from 'wagmi/chains'
import { useDirectWallet } from '../hooks/useDirectWallet'

const SUPPORTED_IDS = [arbitrum.id, arbitrumSepolia.id, hardhat.id]

export default function NetworkGuard() {
  const { isConnected } = useDirectWallet()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || SUPPORTED_IDS.includes(chainId as typeof SUPPORTED_IDS[number])) return null

  return (
    <div className="bg-orange-600 text-white text-sm px-4 py-2 flex items-center justify-center gap-3 flex-wrap">
      <span>Wrong network — please switch to a supported network.</span>
      <div className="flex gap-2">
        <button
          onClick={() => switchChain({ chainId: hardhat.id })}
          disabled={isPending}
          className="bg-white text-orange-700 font-semibold px-3 py-0.5 rounded text-xs
            hover:bg-orange-100 disabled:opacity-60"
        >
          {isPending ? 'Switching…' : 'Localhost'}
        </button>
        <button
          onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
          disabled={isPending}
          className="bg-white text-orange-700 font-semibold px-3 py-0.5 rounded text-xs
            hover:bg-orange-100 disabled:opacity-60"
        >
          {isPending ? 'Switching…' : 'Sepolia'}
        </button>
        <button
          onClick={() => switchChain({ chainId: arbitrum.id })}
          disabled={isPending}
          className="bg-white text-orange-700 font-semibold px-3 py-0.5 rounded text-xs
            hover:bg-orange-100 disabled:opacity-60"
        >
          {isPending ? 'Switching…' : 'Mainnet'}
        </button>
      </div>
    </div>
  )
}
