import { getLocalWalletClient } from './useLocalSigner'

export async function devWriteContract(options: {
  accountIndex: number
  address: `0x${string}`
  abi: any
  functionName: string
  args?: any[]
  value?: bigint
}) {
  const client = getLocalWalletClient(options.accountIndex)
  const hash = await client.writeContract({
    address: options.address,
    abi: options.abi,
    functionName: options.functionName,
    args: options.args ?? [],
    value: options.value,
  })
  return hash
}
