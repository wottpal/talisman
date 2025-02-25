import { BalanceJson, db as balancesDb } from "@talismn/balances"
import {
  Chain,
  ChainId,
  ChainList,
  CustomChain,
  CustomEvmNetwork,
  EvmNetwork,
  EvmNetworkId,
  EvmNetworkList,
  Token,
  TokenId,
  TokenList,
} from "@talismn/chaindata-provider"
import { db as tokenRatesDb } from "@talismn/token-rates"
import { DbTokenRates, TokenRates } from "@talismn/token-rates"
import { useLiveQuery } from "dexie-react-hooks"
import { useEffect, useRef, useState } from "react"
import { useDebounce } from "react-use"

import { provideContext } from "../util/provideContext"
import { useChaindata } from "./useChaindata"

const filterNoTestnet = ({ isTestnet }: { isTestnet?: boolean }) => isTestnet === false

type DbCache = {
  chainsWithTestnets: (Chain | CustomChain)[]
  chainsWithoutTestnets: (Chain | CustomChain)[]
  evmNetworksWithTestnets: (EvmNetwork | CustomEvmNetwork)[]
  evmNetworksWithoutTestnets: (EvmNetwork | CustomEvmNetwork)[]
  tokensWithTestnets: Token[]
  tokensWithoutTestnets: Token[]

  chainsWithTestnetsMap: Record<ChainId, Chain | CustomChain>
  chainsWithoutTestnetsMap: Record<ChainId, Chain | CustomChain>
  evmNetworksWithTestnetsMap: Record<EvmNetworkId, EvmNetwork | CustomEvmNetwork>
  evmNetworksWithoutTestnetsMap: Record<EvmNetworkId, EvmNetwork | CustomEvmNetwork>
  tokensWithTestnetsMap: Record<TokenId, Token>
  tokensWithoutTestnetsMap: Record<TokenId, Token>
  tokenRatesMap: Record<TokenId, TokenRates>

  balances: BalanceJson[]
}

const DEFAULT_VALUE: DbCache = {
  chainsWithTestnets: [],
  chainsWithoutTestnets: [],
  evmNetworksWithTestnets: [],
  evmNetworksWithoutTestnets: [],
  tokensWithTestnets: [],
  tokensWithoutTestnets: [],

  chainsWithTestnetsMap: {},
  chainsWithoutTestnetsMap: {},
  evmNetworksWithTestnetsMap: {},
  evmNetworksWithoutTestnetsMap: {},
  tokensWithTestnetsMap: {},
  tokensWithoutTestnetsMap: {},
  tokenRatesMap: {},

  balances: [],
}

const consolidateDbCache = (
  chainsMap?: ChainList,
  evmNetworksMap?: EvmNetworkList,
  tokensMap?: TokenList,
  tokenRates?: DbTokenRates[],
  allBalances?: BalanceJson[]
): DbCache => {
  if (!chainsMap || !evmNetworksMap || !tokensMap || !tokenRates || !allBalances)
    return DEFAULT_VALUE

  const chainsWithTestnets = Object.values(chainsMap)
  const chainsWithoutTestnets = chainsWithTestnets.filter(filterNoTestnet)
  const chainsWithoutTestnetsMap = Object.fromEntries(
    chainsWithoutTestnets.map((network) => [network.id, network])
  )

  const evmNetworksWithTestnets = Object.values(evmNetworksMap)
  const evmNetworksWithoutTestnets = evmNetworksWithTestnets.filter(filterNoTestnet)
  const evmNetworksWithoutTestnetsMap = Object.fromEntries(
    evmNetworksWithoutTestnets.map((network) => [network.id, network])
  )

  // ensure that we have corresponding network for each token
  const tokensWithTestnets = Object.values(tokensMap).filter(
    (token) =>
      (token.chain && chainsMap[token.chain.id]) ||
      (token.evmNetwork && evmNetworksMap[token.evmNetwork.id])
  )
  const tokensWithoutTestnets = tokensWithTestnets
    .filter(filterNoTestnet)
    .filter(
      (token) =>
        (token.chain && chainsWithoutTestnetsMap[token.chain.id]) ||
        (token.evmNetwork && evmNetworksWithoutTestnetsMap[token.evmNetwork.id])
    )
  const tokensWithTestnetsMap = Object.fromEntries(
    tokensWithTestnets.map((token) => [token.id, token])
  )
  const tokensWithoutTestnetsMap = Object.fromEntries(
    tokensWithoutTestnets.map((token) => [token.id, token])
  )

  const tokenRatesMap = Object.fromEntries(tokenRates.map(({ tokenId, rates }) => [tokenId, rates]))

  // return only balances for which we have a token
  const balances = allBalances.filter((b) => tokensWithTestnetsMap[b.tokenId])

  return {
    chainsWithTestnets,
    chainsWithoutTestnets,
    evmNetworksWithTestnets,
    evmNetworksWithoutTestnets,
    tokensWithTestnets,
    tokensWithoutTestnets,

    chainsWithTestnetsMap: chainsMap,
    chainsWithoutTestnetsMap,
    evmNetworksWithTestnetsMap: evmNetworksMap,
    evmNetworksWithoutTestnetsMap,
    tokensWithTestnetsMap,
    tokensWithoutTestnetsMap,
    tokenRatesMap,

    balances,
  }
}

const useDbCacheProvider = (): DbCache => {
  const chaindataProvider = useChaindata()

  const chainList = useLiveQuery(() => chaindataProvider?.chains(), [chaindataProvider])
  const evmNetworkList = useLiveQuery(() => chaindataProvider?.evmNetworks(), [chaindataProvider])
  const tokenList = useLiveQuery(() => chaindataProvider?.tokens(), [chaindataProvider])
  const tokenRates = useLiveQuery(() => tokenRatesDb.tokenRates.toArray(), [])
  const rawBalances = useLiveQuery(() => balancesDb.balances.toArray(), [])

  const [dbData, setDbData] = useState(DEFAULT_VALUE)

  // debounce every 500ms to prevent hammering UI with updates
  useDebounce(
    () => {
      setDbData(consolidateDbCache(chainList, evmNetworkList, tokenList, tokenRates, rawBalances))
    },
    500,
    [chainList, evmNetworkList, tokenList, tokenRates, rawBalances]
  )

  const refInitialized = useRef(false)

  // force an update as soon as all datasources are fetched, so UI can display data ASAP
  useEffect(() => {
    if (
      !refInitialized.current &&
      chainList &&
      evmNetworkList &&
      tokenList &&
      tokenRates &&
      rawBalances
    ) {
      setDbData(consolidateDbCache(chainList, evmNetworkList, tokenList, tokenRates, rawBalances))
      refInitialized.current = true
    }
  }, [chainList, evmNetworkList, tokenList, tokenRates, rawBalances])

  return dbData
}

export const [DbCacheProvider, useDbCache] = provideContext(useDbCacheProvider)
