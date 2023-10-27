import { Abi } from "@polkadot/api-contract"
import { TypeRegistry } from "@polkadot/types"
import { makeContractCaller } from "@talismn/balances-substrate-psp22"
import { ChainConnector } from "@talismn/chain-connector"

import aznsRouterAbi from "../abi/aznsRouterAbi.json"
import { decodeOutput } from "./decodeHelpers"

/**
 * Resolves an AZERO.ID address to its primary domain.
 *
 * TODO: …
 *
 * @param domain Full domain (name & tld) as a string (e.g. 'alice.tzero')
 * @returns The resolving wallet address (ss58) as a string, or false if the domain is not found
 */
export const resolveAddressToDomain = async (
  chainConnector: ChainConnector,
  chainId: string,
  address: string
): Promise<string | false> => {
  const routerAbi = new Abi(aznsRouterAbi)
  const registry = routerAbi.registry as TypeRegistry
  const routerContractAddress = {
    "aleph-zero": "5FfRtDtpS3Vcr7BTChjPiQNrcAKu3VLv4E1NGF6ng6j3ZopJ",
    "aleph-zero-testnet": "5HXjj3xhtRMqRYCRaXTDcVPz3Mez2XBruyujw6UEkvn8PCiA",
  }[chainId]
  if (!routerContractAddress) throw new Error(`Unsupported chainId: ${chainId}`)

  const contractCall = makeContractCaller({ chainConnector, chainId, registry })
  const result = await contractCall(
    routerContractAddress,
    routerContractAddress,
    registry.createType(
      "Vec<u8>",
      routerAbi.findMessage("get_primary_domains").toU8a([address, undefined])
    )
  )

  const { output, isError, decodedOutput } = decodeOutput(
    result,
    registry,
    routerAbi,
    "get_primary_domains"
  )

  if (isError || !output?.[0]?.[1]) {
    // eslint-disable-next-line no-console
    console.log("Couldn't resolve address to a primary domain:", decodedOutput)
    return false
  }

  return output?.[0]?.[1]
}
