import { Balances } from "@core/domains/balances/types"
import { AccountJson } from "@polkadot/extension-base/background/types"
import { CheckCircleIcon } from "@talismn/icons"
import { classNames } from "@talismn/util"
import { useBalanceDetails } from "@ui/hooks/useBalanceDetails"
import { FC, ReactNode, useCallback } from "react"
import { Checkbox, Tooltip, TooltipContent, TooltipTrigger } from "talisman-ui"

import Fiat from "../Asset/Fiat"
import { AccountIcon } from "./AccountIcon"
import { Address } from "./Address"

const PagerButton: FC<{ disabled?: boolean; children: ReactNode; onClick?: () => void }> = ({
  children,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="bg-grey-850 hover:bg-grey-800 text-body-secondary w-20 rounded-sm p-4 font-bold"
  >
    {children}
  </button>
)

const AccountButtonShimmer = () => (
  <div className={"bg-grey-850 flex h-32 w-full items-center gap-8 rounded px-8"}>
    <div className="bg-grey-750 inline-block h-16 w-16 animate-pulse rounded-full"></div>
    <div className="flex grow flex-col gap-2">
      <div className="rounded-xs bg-grey-750 h-[1.6rem] w-[13rem] animate-pulse"></div>
      <div className="rounded-xs bg-grey-750 h-[1.4rem] w-[6.8rem] animate-pulse"></div>
    </div>
    <div className="rounded-xs bg-grey-750 h-[1.8rem] w-[6.8rem] animate-pulse"></div>
    <div className="rounded-xs bg-grey-750 h-[2rem] w-[2rem] animate-pulse"></div>
  </div>
)

const AccountButton: FC<AccountButtonProps> = ({
  name,
  address,
  genesisHash,
  balances,
  connected,
  selected,
  onClick,
  isBalanceLoading,
}) => {
  const { balanceDetails, totalUsd } = useBalanceDetails(balances)

  return (
    <button
      type="button"
      className={classNames(
        " bg-grey-850 text-grey-200 enabled:hover:bg-grey-800 flex h-32 w-full items-center gap-8 rounded-sm px-8 text-left disabled:opacity-50"
      )}
      disabled={connected}
      onClick={onClick}
    >
      <AccountIcon address={address} genesisHash={genesisHash} className="text-xl" />
      <div className="flex flex-grow flex-col gap-2 overflow-hidden">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</div>
        <div className="text-body-secondary text-sm">
          <Address address={address} startCharCount={6} endCharCount={6} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={classNames(isBalanceLoading && "animate-pulse")}>
              <Fiat className="leading-none" amount={totalUsd} />
            </span>
          </TooltipTrigger>
          {balanceDetails && (
            <TooltipContent>
              <div className="whitespace-pre-wrap text-right">{balanceDetails}</div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
      <div className="flex w-12 shrink-0 flex-col items-center justify-center">
        {connected ? (
          <CheckCircleIcon className="text-primary text-lg" />
        ) : (
          <Checkbox checked={selected} readOnly className="[&>input]:!border-body-disabled" />
        )}
      </div>
    </button>
  )
}

export type DerivedAccountBase = AccountJson & {
  name: string
  accountIndex: number
  address: string
  balances: Balances
  isBalanceLoading: boolean
  connected?: boolean
  selected?: boolean
}

type AccountButtonProps = DerivedAccountBase & {
  onClick: () => void
}

type DerivedAccountPickerBaseProps = {
  accounts: (DerivedAccountBase | null)[]
  canPageBack?: boolean
  disablePaging?: boolean
  onPagerFirstClick?: () => void
  onPagerPrevClick?: () => void
  onPagerNextClick?: () => void
  onAccountClick?: (account: DerivedAccountBase) => void
}

export const DerivedAccountPickerBase: FC<DerivedAccountPickerBaseProps> = ({
  accounts = [],
  disablePaging,
  canPageBack,
  onPagerFirstClick,
  onPagerPrevClick,
  onPagerNextClick,
  onAccountClick,
}) => {
  const handleToggleAccount = useCallback(
    (acc: DerivedAccountBase) => () => {
      onAccountClick?.(acc)
    },
    [onAccountClick]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-4">
        {accounts.map((account, i) =>
          account ? (
            <AccountButton
              key={account.address}
              {...account}
              onClick={handleToggleAccount(account)}
            />
          ) : (
            <AccountButtonShimmer key={i} />
          )
        )}
      </div>
      <div className="flex w-full justify-end gap-6">
        {canPageBack && (
          <PagerButton disabled={disablePaging} onClick={onPagerFirstClick}>
            &lt;&lt;
          </PagerButton>
        )}
        {canPageBack && (
          <PagerButton disabled={disablePaging} onClick={onPagerPrevClick}>
            &lt;
          </PagerButton>
        )}
        <PagerButton disabled={disablePaging} onClick={onPagerNextClick}>
          &gt;
        </PagerButton>
      </div>
    </div>
  )
}
