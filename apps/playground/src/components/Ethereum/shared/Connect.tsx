import { ChangeEventHandler, useCallback } from "react"
import { Button } from "talisman-ui"
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
} from "wagmi"

import { Section } from "../../shared/Section"
import { talismanChains } from "./talismanChains"

export const Connect = () => (
  <Section title="Connection">
    <ConnectInner />
  </Section>
)

const ConnectInner = () => {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const { chain } = useNetwork()
  const { data: balance } = useBalance({
    chainId: chain?.id,
    address,
    enabled: !!address && !!chain,
  })
  const { disconnect } = useDisconnect()
  const { switchNetwork } = useSwitchNetwork()

  const handleSwitchNetwork: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => {
      try {
        switchNetwork?.(Number(e.target.value))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("failed to switch network", err)
      }
    },
    [switchNetwork]
  )

  return isConnected ? (
    <div className="text-body-secondary">
      <div className="h-12">
        <span>Connector : {connector?.name} </span>
        <button
          className="text-grey-300 hover:text-body ml-4 underline underline-offset-1"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
      <div className="h-12">
        Address : <span>{address}</span>
      </div>
      <div className="h-12">
        Network : {chain?.name ?? "UNKNOWN"} ({chain?.id ?? "N/A"})
      </div>

      <div className="h-12">
        Balance : {balance ? `${balance.formatted} ${balance.symbol}` : "UNKNOWN"}
      </div>

      <div className="h-12">
        Network switch :{" "}
        <select
          value={"DEFAULT"}
          onChange={handleSwitchNetwork}
          className="bg-grey-700 text-body rounded-xs h-12  disabled:opacity-50"
          disabled={!connector}
        >
          <option value="DEFAULT">Select</option>
          {talismanChains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name} ({chain.id})
            </option>
          ))}
        </select>
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap gap-4 py-4">
      {connectors.map((connector) => (
        <Button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() => connect({ connector })}
          processing={isLoading && connector.id === pendingConnector?.id}
        >
          {connector.name}
          {!connector.ready && " (unsupported)"}
        </Button>
      ))}

      {error && <div>{error.message}</div>}
    </div>
  )
}
