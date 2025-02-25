import { BigNumber, ethers } from "ethers"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useLocalStorage } from "react-use"
import { Button } from "talisman-ui"
import {
  erc20ABI,
  erc721ABI,
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSendTransaction,
} from "wagmi"

import { TransactionReceipt } from "../shared/TransactionReceipt"
import { useErc721Contract } from "./context"

const IPFS_GATEWAY = "https://ipfs.io/ipfs/"

const getSafeDownloadUrl = (url: string) => (url ? url.replace(/^ipfs:\/\//, IPFS_GATEWAY) : url)

const getNftMetadata = async (metadataUri?: string, thumbWidth?: number, thumbHeight?: number) => {
  if (!metadataUri) return null

  try {
    const fetchMetadata = await fetch(getSafeDownloadUrl(metadataUri))
    const json = await fetchMetadata.json()
    const { name, description, image } = json
    const metadata = {
      name: name as string,
      description: description as string,
      image: getSafeImageUrl(image, thumbWidth, thumbHeight),
    }
    return metadata
  } catch (err) {
    // failed, ignore
    return null
  }
}
const getSafeImageUrl = (url: string, width?: number, height?: number) => {
  try {
    // some images hardcode a gateway, replace it with ours
    const saferUrl = getSafeDownloadUrl(url).replace(/^https?:\/\/[^/]+\/ipfs\//, IPFS_GATEWAY)

    // https://docs.pinata.cloud/gateways/image-optimization
    const imgUrl = new URL(saferUrl)

    if (saferUrl.includes(IPFS_GATEWAY)) {
      if (width) imgUrl.searchParams.set("img-width", width.toString())
      if (height) imgUrl.searchParams.set("img-height", height.toString())
      if (width && height) imgUrl.searchParams.set("img-fit", "cover")
    }

    return imgUrl.toString()
  } catch (err) {
    return url
  }
}
type FormData = { recipient: string; tokenId: string }

const DEFAULT_VALUE: FormData = {
  recipient: "0x5C9EBa3b10E45BF6db77267B40B95F3f91Fc5f67",
  tokenId: "1",
}

export const ERC721Send = () => {
  const { isConnected, address, connector } = useAccount()

  const [contractAddress] = useErc721Contract()
  const [defaultValues, setDefaultValues] = useLocalStorage("pg:send-erc721", DEFAULT_VALUE)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, isSubmitting },
  } = useForm<FormData>({
    defaultValues,
  })

  const formData = watch()

  const { data: tokenURI } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: erc721ABI,
    functionName: "tokenURI",
    args: [BigNumber.from(formData.tokenId)],
    enabled: !!contractAddress && !!formData.tokenId?.length,
    watch: true,
  })

  const { data: balanceOfSelfData } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: erc721ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    enabled: !!contractAddress && !!address,
    watch: true,
  })

  const { config, isSuccess: prepIsSuccess } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: erc721ABI,
    functionName: "safeTransferFrom",
    enabled: !!contractAddress && !!balanceOfSelfData,
    args: [
      address as `0x${string}`,
      formData.recipient as `0x${string}`,
      BigNumber.from(formData.tokenId),
    ],
  })

  const { isLoading: writeIsLoading } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: erc721ABI,
    functionName: "safeTransferFrom",
    mode: "recklesslyUnprepared",
    args: [
      address as `0x${string}`,
      formData.recipient as `0x${string}`,
      BigNumber.from(formData.tokenId),
    ],
  })

  const {
    sendTransaction,
    isLoading: sendIsLoading,
    isSuccess: sendIsSuccess,
    isError: sendIsError,
    data: senddata,
    error: sendError,
  } = useSendTransaction(config)

  const onSubmit = (data: FormData) => {
    setDefaultValues(data)
    sendTransaction?.()
  }

  // allows testing an impossible contract interaction (transfer more than you have to test)
  const handleSendUnchecked = useCallback(async () => {
    if (!connector) return

    const ci = new ethers.utils.Interface(erc20ABI)

    const funcFragment = ci.fragments.find(
      (f) => f.type === "function" && f.name === "transfer"
    ) as ethers.utils.FunctionFragment

    const data = ci.encodeFunctionData(funcFragment, [
      address,
      formData.recipient,
      formData.tokenId,
    ])

    const provider = await connector.getProvider()
    await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          to: contractAddress,
          data,
        },
      ],
    })
  }, [address, connector, contractAddress, formData])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metadata, setMetadata] = useState<any>()
  const [metadataError, setMetadataError] = useState<unknown>()
  useEffect(() => {
    setMetadata(undefined)
    setMetadataError(undefined)

    if (tokenURI) getNftMetadata(tokenURI).then(setMetadata).catch(setMetadataError)
  }, [tokenURI])

  if (!isConnected) return null

  return (
    <div className="mt-8">
      <h3 className="text-lg">Send</h3>
      {contractAddress ? (
        <>
          <form className="text-body-secondary space-y-1 " onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center">
              <label className="w-48" htmlFor="send-tokens-to">
                Recipient :
              </label>
              <input
                className="h-12 w-[42rem] font-mono text-sm"
                id="send-tokens-to"
                type="text"
                autoComplete="off"
                spellCheck={false}
                {...register("recipient", { required: true })}
              />
            </div>
            <div className="flex items-center">
              <label className="w-48" htmlFor="send-tokens-amount">
                TokenId :
              </label>
              <input
                id="send-tokens-amount"
                type="text"
                spellCheck={false}
                autoComplete="off"
                className="h-12 w-[42rem] font-mono text-sm"
                {...register("tokenId", { required: true })}
              />
            </div>
            {metadata && (
              <div className="flex gap-8">
                <pre className="max-w-[600px] grow">{JSON.stringify(metadata, undefined, 2)}</pre>
                {!!metadata?.image && (
                  <img src={metadata.image as string} alt="" className="h-64 w-64" />
                )}
              </div>
            )}

            {metadataError && (
              <div className="text-alert-error">
                Failed to load token Metadata : {metadataError?.toString()}
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                processing={sendIsLoading}
                disabled={!isValid || isSubmitting || !prepIsSuccess}
                small
              >
                Send
              </Button>
              <Button
                type="button"
                processing={writeIsLoading}
                disabled={!isValid || isSubmitting}
                onClick={handleSendUnchecked}
                small
              >
                Send (unchecked)
              </Button>
            </div>
            {sendIsSuccess && (
              <pre className="text-alert-success my-8 ">
                Transaction: {JSON.stringify(senddata, undefined, 2)}
              </pre>
            )}
            {sendIsError && (
              <div className="text-alert-error my-8 ">Error : {sendError?.message}</div>
            )}
            <TransactionReceipt hash={senddata?.hash} />
          </form>
        </>
      ) : (
        <div className="text-body-secondary">Contract address isn't valid</div>
      )}
    </div>
  )
}
