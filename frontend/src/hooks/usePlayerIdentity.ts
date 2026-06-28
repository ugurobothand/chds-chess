import { useDirectWallet } from './useDirectWallet'
import { useDevMode } from './useDevMode'
import { ANVIL_ACCOUNTS } from './useLocalSigner'

export function usePlayerIdentity() {
  const { address } = useDirectWallet()
  const { accountIndex, isDevMode } = useDevMode()

  const playerAddress = isDevMode && accountIndex !== null
    ? ANVIL_ACCOUNTS[accountIndex]?.address
    : address

  return {
    playerAddress,
    normalizedPlayerAddress: playerAddress?.toLowerCase() ?? null,
  }
}
