import { useChainConnectors } from "@talismn/balances-react"
import { useEffect, useState } from "react"
import { resolveAddressToDomain } from "./utils/resolveAddressToDomain"
import { resolveDomainToAddress } from "./utils/resolveDomainToAddress"


export function App(): JSX.Element {
  const chainId = 'aleph-zero-testnet'
  const { substrate: chainConnector } = useChainConnectors()

  const [resolvedAddress, setResolvedAddress] = useState<string>()
  const handleResolveDomain = async () => {
    const domain = (document.getElementById('input-domain') as HTMLInputElement).value
    const address =await resolveDomainToAddress(chainConnector, chainId, domain)
    setResolvedAddress(address || 'Not found')
  }

  const [resolvedDomain, setResolvedDomain] = useState<string>()
  const handleResolveAddress = async () => {
    const address = (document.getElementById('input-address') as HTMLInputElement).value
    const domain =await resolveAddressToDomain(chainConnector, chainId, address)
    setResolvedDomain(domain || 'Not found')
  }

  useEffect(() => {
    handleResolveDomain()
    handleResolveAddress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>
    <main className="flex flex-col min-h-screen items-center gap-14 justify-center">
      
      <h1 className="text-lg">AZERO.ID Domains Demo</h1>
    
      {/* Resolving Domain → Address */}
      <div className="flex flex-col gap-4 justify-center items-center">
        <p>
          Domain:
          <input id="input-domain" defaultValue="alice.tzero" />
          <button className="bg-white text-black ml-4 p-4 rounded-sm" onClick={() => handleResolveDomain()}>Resolve Address</button>
        </p>
        <p>{resolvedAddress}</p>
        
      </div>
    
      {/* Resolving Address → Domain */}
      <div className="flex flex-col gap-4 justify-center items-center">
        <p>
          Address: 
          <input id="input-address" defaultValue="5FeiwHgmyq6NXQZkFdw7vwU43bWKUMovZKT2SNMohfj4NQGu" />
          <button className="bg-white text-black ml-4 p-4 rounded-sm" onClick={() => handleResolveAddress()}>Resolve Primary Domain</button>
        </p>
        <p>{resolvedDomain}</p>
      </div>

      <small className="text-grey-400 max-w-prose text-center">Info: Wallets can own multiple domains, but only set one singly <em>primary domain</em>. Domains can be resolving to only one wallet address (though they can be owned or controlled by others).</small>
    </main>
  </>
}
