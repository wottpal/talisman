import { encodeAnyAddress } from "@talismn/util"

/**
 *
 * @param address
 * @param prefix if supplied, the method will also check the prefix
 * @returns true if valid substrate (SS58) address, false otherwise
 */
export const isValidAddress = (address: string, prefix?: number | null) => {
  try {
    // attempt to encode, it will throw an error if address is invalid
    const encoded = encodeAnyAddress(address, prefix ?? undefined)

    //if a prefix is supplied, check that reencoding using this prefix matches the input address
    if (prefix !== undefined) return address === encoded

    //if no prefix supplied, the fact that decoding + encoding succeded indicates that the address is valid
    return true
  } catch (error) {
    // input is not a substrate (SS58) address
    return false
  }
}
