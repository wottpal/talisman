import { db } from "@core/db"
import { RequestMetadataApprove, RequestMetadataReject } from "@core/domains/metadata/types"
import { ExtensionHandler } from "@core/libs/Handler"
import { requestStore } from "@core/libs/requests/store"
import { log } from "@core/log"
import type { MessageTypes, RequestType, RequestTypes, ResponseType } from "@core/types"
import { Port } from "@core/types/base"
import { assert } from "@polkadot/util"

import { metadataUpdatesStore } from "./metadataUpdates"

export default class MetadataHandler extends ExtensionHandler {
  private async metadataApprove({ id }: RequestMetadataApprove): Promise<boolean> {
    try {
      const queued = requestStore.getRequest(id)

      assert(queued, "Unable to find request")

      const { request, resolve } = queued

      await db.metadata.put(request)

      resolve(true)

      return true
    } catch (err) {
      log.error("Failed to update metadata", { err })
      throw new Error("Failed to update metadata")
    }
  }

  private metadataReject({ id }: RequestMetadataReject): boolean {
    const queued = requestStore.getRequest(id)

    assert(queued, "Unable to find request")

    const { reject } = queued

    reject(new Error("Rejected"))

    return true
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: Port
  ): Promise<ResponseType<TMessageType>> {
    // Then try remaining which are present in this class
    switch (type) {
      // --------------------------------------------------------------------
      // metadata handlers --------------------------------------------------
      // --------------------------------------------------------------------
      case "pri(metadata.approve)":
        return await this.metadataApprove(request as RequestMetadataApprove)

      case "pri(metadata.reject)":
        return this.metadataReject(request as RequestMetadataReject)

      case "pri(metadata.updates.subscribe)": {
        const { id: genesisHash } = request as RequestType<"pri(metadata.updates.subscribe)">
        return metadataUpdatesStore.subscribe(id, port, genesisHash)
      }

      default:
        throw new Error(`Unable to handle message of type ${type}`)
    }
  }
}
