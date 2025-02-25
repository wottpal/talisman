import { db } from "@core/db"
import { log } from "@core/log"
import { TypeRegistry } from "@polkadot/types"
import { HexString } from "@polkadot/util/types"
import { SignerPayloadJSON } from "@substrate/txwrapper-core"
import { Address } from "@talismn/balances"
import { ethers } from "ethers"
import merge from "lodash/merge"

import { serializeTransactionRequestBigNumbers } from "../ethereum/helpers"
import { TransactionStatus } from "./types"

type AddTransactionOptions = {
  label?: string
  siteUrl?: string
  tokenId?: string
  value?: string
  to?: Address
}

const DEFAULT_OPTIONS: AddTransactionOptions = {
  label: "Transaction",
}

export const addEvmTransaction = async (
  hash: string,
  unsigned: ethers.providers.TransactionRequest,
  options: AddTransactionOptions = {}
) => {
  const { siteUrl, label, tokenId, value, to } = merge(structuredClone(DEFAULT_OPTIONS), options)

  try {
    if (!unsigned.chainId || !unsigned.from || unsigned.nonce === undefined)
      throw new Error("Invalid transaction")

    const evmNetworkId = String(unsigned.chainId)
    const nonce = ethers.BigNumber.from(unsigned.nonce).toNumber()
    const isReplacement =
      (await db.transactions
        .filter(
          (row) =>
            row.networkType === "evm" && row.evmNetworkId === evmNetworkId && row.nonce === nonce
        )
        .count()) > 0

    await db.transactions.add({
      hash,
      networkType: "evm",
      evmNetworkId,
      account: unsigned.from,
      nonce,
      isReplacement,
      unsigned: serializeTransactionRequestBigNumbers(unsigned),
      status: "pending",
      siteUrl,
      label,
      tokenId,
      value,
      to,
      timestamp: Date.now(),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("addEvmTransaction", { err })
    log.error("addEvmTransaction", { err, hash, unsigned, options })
  }
}

export const addSubstrateTransaction = async (
  hash: string,
  payload: SignerPayloadJSON,
  options: AddTransactionOptions = {}
) => {
  const { siteUrl, label, tokenId, value, to } = merge(structuredClone(DEFAULT_OPTIONS), options)

  try {
    if (!payload.genesisHash || !payload.nonce || !payload.address)
      throw new Error("Invalid transaction")

    await db.transactions.add({
      hash,
      networkType: "substrate",
      genesisHash: payload.genesisHash,
      account: payload.address,

      nonce: Number(payload.nonce),
      unsigned: payload,
      status: "pending",
      siteUrl,
      label,
      tokenId,
      value,
      to,
      timestamp: Date.now(),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("addSubstrateTransaction", { err })
    log.error("addSubstrateTransaction", { err, hash, payload, options })
  }
}

export const updateTransactionStatus = async (
  hash: string,
  status: TransactionStatus,
  blockNumber?: number
) => {
  try {
    await db.transactions.update(hash, { status, blockNumber: blockNumber?.toString() })

    if (["success", "error"].includes(status)) {
      const tx = await db.transactions.get(hash)

      // mark pending transactions with the same nonce as replaced
      if (tx)
        await db.transactions
          .filter(
            (row) =>
              ((tx.networkType === "evm" &&
                row.networkType === "evm" &&
                row.evmNetworkId === tx.evmNetworkId) ||
                (tx.networkType === "substrate" &&
                  row.networkType === "substrate" &&
                  row.genesisHash === tx.genesisHash)) &&
              row.nonce === tx.nonce &&
              ["pending", "unknown"].includes(row.status)
          )
          .modify({ status: "replaced" })
    }

    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("updateEvmTransaction", { err })
    return false
  }
}

export const updateTransactionsRestart = async () => {
  try {
    // mark all pending transactions as unknown
    await db.transactions.where("status").equals("pending").modify({ status: "unknown" })

    // delete all transactions older than 7 days
    const cutOffDate = Date.now() - 7 * 24 * 60 * 60 * 1000
    await db.transactions.where("timestamp").below(cutOffDate).delete()

    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("updateTransactionsRestart", { err })
    return false
  }
}

export const getExtrinsicHash = (
  registry: TypeRegistry,
  payload: SignerPayloadJSON,
  signature: HexString
) => {
  const tx = registry.createType(
    "Extrinsic",
    { method: payload.method },
    { version: payload.version }
  )
  tx.addSignature(payload.address, signature, payload)
  return tx.hash.toHex()
}

export const dismissTransaction = (hash: string) => db.transactions.delete(hash)
