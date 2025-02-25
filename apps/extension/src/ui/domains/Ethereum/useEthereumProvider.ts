import { EvmNetworkId } from "@core/domains/ethereum/types"
import { getExtensionEthereumProvider } from "@ui/domains/Ethereum/getExtensionEthereumProvider"
import { ethers } from "ethers"
import { useMemo } from "react"

export const useEthereumProvider = (
  evmNetworkId?: EvmNetworkId
): ethers.providers.JsonRpcProvider | undefined => {
  const provider = useMemo(() => {
    if (!evmNetworkId) return undefined
    return getExtensionEthereumProvider(evmNetworkId)
  }, [evmNetworkId])

  return provider
}
