import { createConfig, http } from 'wagmi'
import { arbitrum, arbitrumSepolia, hardhat } from 'wagmi/chains'

export const config = createConfig({
  chains: [hardhat, arbitrum, arbitrumSepolia],
  transports: {
    [arbitrum.id]:        http(import.meta.env.VITE_ARBITRUM_RPC         || 'https://arb1.arbitrum.io/rpc'),
    [arbitrumSepolia.id]: http(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'),
    [hardhat.id]:         http('http://localhost:8545'),
  },
})
