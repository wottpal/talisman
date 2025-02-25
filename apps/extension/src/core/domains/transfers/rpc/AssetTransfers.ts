import { balanceModules } from "@core/domains/balances/store"
import { SignerPayloadJSON } from "@core/domains/signing/types"
import {
  WalletTransactionTransferInfo,
  dismissTransaction,
  watchSubstrateTransaction,
} from "@core/domains/transactions"
import { AssetTransferMethod, ResponseAssetTransferFeeQuery } from "@core/domains/transfers/types"
import { chainConnector } from "@core/rpcs/chain-connector"
import { chaindataProvider } from "@core/rpcs/chaindata"
import { Address } from "@core/types/base"
import { getExtrinsicDispatchInfo } from "@core/util/getExtrinsicDispatchInfo"
import { getRuntimeVersion } from "@core/util/getRuntimeVersion"
import { getTypeRegistry } from "@core/util/getTypeRegistry"
import { validateHexString } from "@core/util/validateHexString"
import { KeyringPair } from "@polkadot/keyring/types"
import { TypeRegistry } from "@polkadot/types"
import { Extrinsic } from "@polkadot/types/interfaces"
import { assert } from "@polkadot/util"
import { HexString } from "@polkadot/util/types"
import { Chain, ChainId, TokenId } from "@talismn/chaindata-provider"

export default class AssetTransfersRpc {
  /**
   * Transfers an amount of a token from one account to another.
   *
   * @param chainId - The chain to make the transfer on.
   * @param tokenId - The token id to transfer.
   * @param amount - The amount of planck units to transfer.
   * @param from - An unlocked keypair of the sending account.
   * @param to - An address of the receiving account.
   * @param callback - A callback which will receive tx status updates.
   *                   It is automatically unsubscribed if an error occurs.
   *                   It is automatically unsubscribed when the tx is finalized.
   * @returns A promise which resolves once the tx is submitted (but before it is included in a block or finalized!)
   */
  static async transfer(
    chainId: ChainId,
    tokenId: TokenId,
    amount: string,
    from: KeyringPair,
    to: Address,
    tip: string,
    method: AssetTransferMethod
  ) {
    const { chain, registry, tx, unsigned, signature } = await this.prepareTransaction(
      chainId,
      tokenId,
      amount,
      from,
      to,
      tip,
      method,
      true
    )

    assert(signature, "transaction is not signed")

    const token = await chaindataProvider.getToken(tokenId)

    const hash = await watchSubstrateTransaction(chain, registry, unsigned, signature, {
      transferInfo: {
        tokenId: token?.id,
        value: amount,
        to,
      },
    })

    try {
      await chainConnector.send(chain.id, "author_submitExtrinsic", [tx.toHex()])
    } catch (err) {
      dismissTransaction(hash)
      throw err
    }

    return tx.hash.toHex()
  }

  static async transferSigned(
    unsigned: SignerPayloadJSON,
    signature: `0x${string}`,
    transferInfo: WalletTransactionTransferInfo
  ) {
    const genesisHash = validateHexString(unsigned.genesisHash)
    const chain = await chaindataProvider.getChain({ genesisHash })
    if (!chain) throw new Error(`Could not find chain for genesisHash ${genesisHash}`)

    const { registry } = await getTypeRegistry(chain.id)

    // create the unsigned extrinsic
    const tx = registry.createType(
      "Extrinsic",
      { method: unsigned.method },
      { version: unsigned.version }
    )

    // apply signature
    tx.addSignature(unsigned.address, signature, unsigned)

    await watchSubstrateTransaction(chain, registry, unsigned, signature, { transferInfo })

    await chainConnector.send(chain.id, "author_submitExtrinsic", [tx.toHex()])

    return tx.hash.toHex()
  }

  /**
   * Calculates an estimated fee for transferring an amount of nativeToken from one account to another.
   *
   * @param chainId - The chain to make the transfer on.
   * @param tokenId - The token id to transfer.
   * @param amount - The amount of planck units to transfer.
   * @param from - An unlocked keypair of the sending account.
   * @param to - An address of the receiving account.
   * @returns An object containing the calculated `partialFee` as returned from the `payment_queryInfo` rpc endpoint.
   */
  static async checkFee(
    chainId: ChainId,
    tokenId: TokenId,
    amount: string,
    from: KeyringPair,
    to: Address,
    tip: string,
    method: AssetTransferMethod
  ): Promise<ResponseAssetTransferFeeQuery> {
    const { tx, unsigned } = await this.prepareTransaction(
      chainId,
      tokenId,
      amount,
      from,
      to,
      tip,
      method,
      false
    )

    const { partialFee } = await getExtrinsicDispatchInfo(chainId, tx)

    return { partialFee, unsigned }
  }

  /**
   * Builds a signed asset transfer transaction, ready for submission to the chain.
   *
   * @param chainId - The chain to make the transfer on.
   * @param tokenId - The token id to transfer.
   * @param amount - The amount of planck units to transfer.
   * @param from - An unlocked keypair of the sending account.
   * @param to - An address of the receiving account.
   * @returns An object containing:
   *          - `tx` the signed transaction.
   *          - `unsigned` the same transaction but without a signature.
   *          - `registry` a type registry containing metadata for the chain this transaction should be submitted to.
   */
  private static async prepareTransaction(
    chainId: ChainId,
    tokenId: TokenId,
    amount: string,
    from: KeyringPair,
    to: Address,
    tip: string,
    method: AssetTransferMethod,
    sign: boolean
  ): Promise<{
    tx: Extrinsic
    registry: TypeRegistry
    unsigned: SignerPayloadJSON
    chain: Chain
    signature?: HexString
  }> {
    const chain = await chaindataProvider.getChain(chainId)
    assert(chain?.genesisHash, `Chain ${chainId} not found in store`)
    const { genesisHash } = chain

    const token = await chaindataProvider.getToken(tokenId)
    assert(token, `Token ${tokenId} not found in store`)

    const [blockHash, { block }, nonce, runtimeVersion] = await Promise.all([
      chainConnector.send(chainId, "chain_getBlockHash", [], false),
      chainConnector.send(chainId, "chain_getBlock", [], false),
      chainConnector.send(chainId, "system_accountNextIndex", [from.address]),
      getRuntimeVersion(chainId),
    ])

    const { specVersion, transactionVersion } = runtimeVersion

    const { registry, metadataRpc } = await getTypeRegistry(chainId, specVersion, blockHash)
    assert(metadataRpc, "Could not fetch metadata")

    const palletModule = balanceModules.find((m) => m.type === token.type)
    assert(palletModule, `Failed to construct tx for token of type '${token.type}'`)

    if (
      !(
        "substrate-native" === palletModule.type ||
        "substrate-orml" === palletModule.type ||
        "substrate-assets" === palletModule.type ||
        "substrate-tokens" === palletModule.type ||
        "substrate-psp22" === palletModule.type ||
        "substrate-equilibrium" === palletModule.type
      )
    )
      throw new Error(
        `${token.symbol} transfers on ${token.chain?.id} are not implemented in this version of Talisman.`
      )

    const transaction = await palletModule.transferToken({
      tokenId,
      from: from.address,
      to,
      amount,

      registry,
      metadataRpc,
      blockHash,
      blockNumber: block.header.number,
      nonce,
      specVersion,
      transactionVersion,
      tip,
      transferMethod: method,
    })

    assert(transaction, `Failed to construct tx for token '${token.id}'`)
    assert(
      transaction.type === "substrate",
      `Failed to handle tx type ${transaction.type} for token '${token.id}'`
    )

    const unsigned = transaction.tx

    // If the following line of code is not added, the extrinsic (referred to as "unsigned" here)
    // will fail when submitted to the Picasso chain, resulting in a wasm runtime panic.
    // It's possible that other chains will also experience this issue, but Picasso is the first
    // one where we've encountered it.
    //
    // In the defineMethod function of @substrate/txwrapper-core, the assetId is set to 0.
    // You can find the code for this function here:
    // https://github.com/paritytech/txwrapper-core/blob/90a231e07e69de96602f92d37897493ac2e7b7f7/packages/txwrapper-core/src/core/method/defineMethod.ts#LL160C3-L160C10
    //
    // As far as we can tell, on most chains, the assetId is ignored, so the encoding of 0 is
    // nothing, represented as an empty string in the hex-encoded extrinsic.
    // However, on the Picasso chain, the assetId is not ignored, and the 0 set by defineMethod is
    // encoded as 01 00000000.
    // This causes a wasm runtime panic when the extrinsic is submitted to the chain.
    //
    // Extrinsics constructed using polkadot.js apps for the Picasso chain encode the assetId as 00,
    // and these extrinsics don't cause a runtime panic when submitted.
    //
    // If we override the default assetId value from @substrate/txwrapper-core (which sets assetId to 0)
    // and instead set assetId back to undefined, our extrinsics also encode the assetId field as 00.
    if (unsigned.assetId === 0) unsigned.assetId = undefined

    // create the unsigned extrinsic
    const tx = registry.createType(
      "Extrinsic",
      { method: unsigned.method },
      { version: unsigned.version }
    )

    if (sign) {
      // create signable extrinsic payload
      const extrinsicPayload = registry.createType("ExtrinsicPayload", unsigned, {
        version: unsigned.version,
      })

      // sign it using keyring (will fail if keyring is locked or if address is from hardware device)
      const { signature } = extrinsicPayload.sign(from)

      // apply signature
      tx.addSignature(unsigned.address, signature, unsigned)

      return { tx, registry, unsigned, chain, signature }
    } else {
      // tx signed with fake signature for fee calculation
      tx.signFake(unsigned.address, { blockHash, genesisHash, nonce, runtimeVersion })

      return { tx, registry, unsigned, chain, signature: undefined }
    }
  }
}
