import { AccountJsonDcent } from "@core/domains/accounts/types"
import { EthSignMessageMethod } from "@core/domains/signing/types"
import i18next from "@core/i18nConfig"
import { log } from "@core/log"
import { isHexString } from "@ethereumjs/util"
import { hexToString } from "@polkadot/util"
import { HexString } from "@polkadot/util/types"
import { classNames } from "@talismn/util"
import { DcentError, dcent } from "@ui/util/dcent"
import { useBringPopupBackInFront } from "@ui/util/dcent/useBringPopupBackInFront"
import DcentWebConnector from "dcent-web-connector"
import { ethers } from "ethers"
import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "talisman-ui"

import { ErrorMessageDrawer } from "./ErrorMessageDrawer"
import { SignHardwareEthereumProps } from "./SignHardwareEthereum"

const signWithDcent = async (
  method: EthSignMessageMethod | "eth_sendTransaction",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  accountPath: string
): Promise<HexString> => {
  switch (method) {
    case "eth_signTypedData_v3":
    case "eth_signTypedData_v4": {
      const version = (method.split("_")[2] ?? "v4").toUpperCase()
      const clearTextJson = isHexString(payload) ? hexToString(payload) : payload
      const json = JSON.parse(clearTextJson)

      const response = await dcent.getEthereumSignedData(accountPath, version, json)

      return response.sign as HexString
    }

    case "personal_sign": {
      const clearText = isHexString(payload) ? hexToString(payload) : payload

      const response = await dcent.getEthereumSignedMessage(accountPath, clearText)

      return response.sign as HexString
    }

    case "eth_sendTransaction": {
      const {
        accessList,
        to,
        nonce,
        gasLimit,
        gasPrice,
        data,
        value,
        chainId,
        type,
        maxPriorityFeePerGas,
        maxFeePerGas,
      } = await ethers.utils.resolveProperties(payload as ethers.providers.TransactionRequest)

      const baseTx: ethers.utils.UnsignedTransaction = {
        to,
        gasLimit,
        chainId,
        type,
      }

      if (nonce !== undefined) baseTx.nonce = ethers.BigNumber.from(nonce).toNumber()
      if (maxPriorityFeePerGas) baseTx.maxPriorityFeePerGas = maxPriorityFeePerGas
      if (maxFeePerGas) baseTx.maxFeePerGas = maxFeePerGas
      if (gasPrice) baseTx.gasPrice = gasPrice
      if (data) baseTx.data = data
      if (value) baseTx.value = value
      if (accessList) baseTx.accessList = accessList

      // Note : most fields can't be undefined
      const args = [
        DcentWebConnector.coinType.ETHEREUM,
        ethers.BigNumber.from(nonce).toString(),
        type === 2 ? undefined : gasPrice?.toString(),
        gasLimit?.toString() ?? "21000",
        to,
        value?.toString() ?? "0",
        data ?? "0x",
        accountPath,
        chainId,
      ]

      if (type === 2)
        args.push(2, {
          accessList: accessList ?? [],
          maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
          maxFeePerGas: maxFeePerGas?.toString(),
        })

      const result = await dcent.getEthereumSignedTransaction(...args)

      return ethers.utils.serializeTransaction(baseTx, {
        v: ethers.BigNumber.from(result.sign_v).toNumber(),
        r: result.sign_r,
        s: result.sign_s,
      }) as `0x${string}`
    }
    // other message types are unsupported
    // case "eth_signTypedData":
    // case "eth_signTypedData_v1":
    default: {
      throw new Error(i18next.t("This type of message cannot be signed with D'CENT."))
    }
  }
}

const SignDcentEthereum: FC<SignHardwareEthereumProps> = ({
  account,
  method,
  payload,
  className,
  containerId,
  onSentToDevice, // TODO to manage error, maybe rename and change to a have a boolean indicating if waiting signature or not (then call again with false )
  onSigned,
  onCancel,
}) => {
  const { t } = useTranslation("request")
  const [isSigning, setIsSigning] = useState(false)
  const [isSigned, setIsSigned] = useState(false)
  const [displayedErrorMessage, setDisplayedErrorMessage] = useState<string>()
  const { startListening, stopListening } = useBringPopupBackInFront()
  // reset
  useEffect(() => {
    setIsSigned(false)
  }, [payload])

  const handleSendClick = useCallback(async () => {
    if (!onSigned || !payload || !account) {
      return
    }
    setIsSigning(true)
    setDisplayedErrorMessage(undefined)
    onSentToDevice?.(true)

    try {
      // this will open the bridge page that may hide Talisman popup => bring talisman back in front
      startListening()
      const signature = await signWithDcent(method, payload, (account as AccountJsonDcent).path)
      stopListening()

      await onSigned({ signature })
      setIsSigned(true)
    } catch (err) {
      stopListening()
      log.error("Failed to sign", { err })
      if (err instanceof DcentError) {
        if (err.code !== "user_cancel") setDisplayedErrorMessage(err.message)
      } else setDisplayedErrorMessage((err as Error).message ?? t("Failed to sign"))
      setIsSigning(false)
      dcent.popupWindowClose()
    }
    onSentToDevice?.(false)
    setIsSigning(false)
  }, [onSigned, payload, account, onSentToDevice, startListening, method, stopListening, t])

  return (
    <div className={classNames("flex w-full flex-col gap-6", className)}>
      <Button
        className="w-full"
        disabled={!payload}
        primary
        onClick={handleSendClick}
        processing={isSigning || isSigned}
      >
        {t("Approve on D'CENT")}
      </Button>
      {onCancel && (
        <Button className="w-full" onClick={onCancel}>
          {t("Cancel")}
        </Button>
      )}
      <ErrorMessageDrawer
        message={displayedErrorMessage}
        containerId={containerId}
        onDismiss={() => setDisplayedErrorMessage(undefined)}
      />
    </div>
  )
}

// default export to allow for lazy loading
export default SignDcentEthereum
