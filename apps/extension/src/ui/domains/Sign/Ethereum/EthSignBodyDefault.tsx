import { BalanceFormatter } from "@core/domains/balances"
import { useEthSignTransactionRequest } from "@ui/domains/Sign/SignRequestContext"
import useToken from "@ui/hooks/useToken"
import { useTokenRates } from "@ui/hooks/useTokenRates"
import { ethers } from "ethers"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { SignContainer } from "../SignContainer"
import { SignParamAccountButton, SignParamNetworkAddressButton } from "./shared"
import { SignParamTokensDisplay } from "./shared/SignParamTokensDisplay"

export const EthSignBodyDefault: FC = () => {
  const { t } = useTranslation("request")
  const { network, transactionInfo, request } = useEthSignTransactionRequest()

  const nativeToken = useToken(network?.nativeToken?.id)
  const nativeTokenRates = useTokenRates(nativeToken?.id)

  const amount = useMemo(() => {
    return nativeToken && transactionInfo?.value?.gt(0)
      ? new BalanceFormatter(
          transactionInfo.value.toString(),
          nativeToken.decimals,
          nativeTokenRates
        )
      : null
  }, [nativeToken, nativeTokenRates, transactionInfo?.value])

  const { from } = useMemo(
    () => request as Required<ethers.providers.TransactionRequest>,
    [request]
  )

  if (!transactionInfo) return null
  if (!network) return null
  if (!nativeToken) return null

  return (
    <SignContainer
      networkType="ethereum"
      title={amount && request.to ? t("Transfer Request") : t("Transaction Request")}
    >
      {amount && request.to ? (
        <>
          <div>{t("You are transferring")}</div>
          <div>
            <SignParamTokensDisplay
              withIcon
              tokenId={nativeToken.id}
              tokens={amount.tokens}
              fiat={amount}
              decimals={nativeToken.decimals}
              symbol={nativeToken.symbol}
            />
          </div>
          <div className="flex">
            <span>{t("from")} </span>
            <SignParamAccountButton address={from} withIcon />
          </div>
          <div className="flex">
            <span>{transactionInfo.isContractCall ? t("to contract") : t("to account")} </span>
            {transactionInfo.isContractCall ? (
              <SignParamNetworkAddressButton network={network} address={request.to} />
            ) : (
              <SignParamAccountButton
                explorerUrl={network.explorerUrl}
                address={request.to}
                withIcon
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div>{t("You are submitting a transaction")}</div>
          <div className="flex">
            <span>{t("with")}</span>
            <SignParamAccountButton address={from} withIcon />
          </div>
          {request.to ? (
            <div className="flex">
              <span>{t("on contract")}</span>
              <SignParamNetworkAddressButton network={network} address={request.to} />
            </div>
          ) : null}
        </>
      )}
      {transactionInfo.contractCall?.name && (
        <div>
          {t("method:")} <span className="text-white">{transactionInfo.contractCall.name}</span>
        </div>
      )}
    </SignContainer>
  )
}
