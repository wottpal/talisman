import {
  TALISMAN_WEB_APP_CROWDLOANS_URL,
  TALISMAN_WEB_APP_NFTS_URL,
  TALISMAN_WEB_APP_STAKING_URL,
  TALISMAN_WEB_APP_TRANSPORT_URL,
} from "@core/constants"
import { Nav } from "@talisman/components/Nav"
import {
  CreditCardIcon,
  DownloadAlertIcon,
  HistoryIcon,
  ImageIcon,
  PieChartIcon,
  PlusIcon,
  RepeatIcon,
  SettingsIcon,
  StarIcon,
  ZapIcon,
} from "@talismn/icons"
import { useBuyTokensModal } from "@ui/domains/Asset/Buy/BuyTokensModalContext"
import { useSelectedAccount } from "@ui/domains/Portfolio/SelectedAccountContext"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useIsFeatureEnabled } from "@ui/hooks/useFeatures"
import useMnemonicBackup from "@ui/hooks/useMnemonicBackup"
import { getTransactionHistoryUrl } from "@ui/util/getTransactionHistoryUrl"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { SidebarNavItem } from "./SidebarNavItem"

export const MainSidebar = () => {
  const { t } = useTranslation()

  const { account } = useSelectedAccount()
  const navigate = useNavigate()
  const { genericEvent } = useAnalytics()
  const showBuyCryptoButton = useIsFeatureEnabled("BUY_CRYPTO")
  const showStaking = useIsFeatureEnabled("LINK_STAKING")

  const { isSnoozed } = useMnemonicBackup()

  const handlePortfolioClick = useCallback(() => {
    genericEvent("goto portfolio", { from: "sidebar" })
    navigate("/portfolio")
  }, [genericEvent, navigate])

  const handleAddAccountClick = useCallback(() => {
    genericEvent("goto add account", { from: "sidebar" })
    navigate("/accounts/add")
  }, [genericEvent, navigate])

  const handleNftsClick = useCallback(() => {
    genericEvent("open web app nfts", { from: "sidebar", target: "nfts" })
    window.open(TALISMAN_WEB_APP_NFTS_URL, "_blank")
    return false
  }, [genericEvent])

  const handleStakingClick = useCallback(() => {
    genericEvent("open web app staking", { from: "sidebar", target: "staking" })
    window.open(TALISMAN_WEB_APP_STAKING_URL, "_blank")
    return false
  }, [genericEvent])

  const showTxHistory = useIsFeatureEnabled("LINK_TX_HISTORY")
  const handleTxHistoryClick = useCallback(() => {
    genericEvent("open web app tx history", { from: "sidebar" })
    window.open(getTransactionHistoryUrl(account?.address), "_blank")
    return false
  }, [account?.address, genericEvent])

  const handleTransportClick = useCallback(() => {
    genericEvent("open web app transport", { from: "sidebar" })
    window.open(TALISMAN_WEB_APP_TRANSPORT_URL, "_blank")
    return false
  }, [genericEvent])

  const handleCrowdloansClick = useCallback(() => {
    genericEvent("open web app crowdloans", { from: "sidebar", target: "crowdloans" })
    window.open(TALISMAN_WEB_APP_CROWDLOANS_URL, "_blank")
  }, [genericEvent])

  const handleSettingsClick = useCallback(() => {
    genericEvent("goto settings", { from: "sidebar" })
    navigate("/settings/general")
  }, [genericEvent, navigate])

  const { open: openBuyModal } = useBuyTokensModal()
  const handleBuyClick = useCallback(() => {
    genericEvent("open buy tokens", { from: "sidebar" })
    openBuyModal()
  }, [genericEvent, openBuyModal])

  const handleBackupClick = useCallback(() => {
    genericEvent("goto backup modal", { from: "sidebar" })
    navigate("/settings/mnemonics?showBackupModal")
  }, [genericEvent, navigate])

  return (
    <Nav className="gap-1 p-4 text-sm lg:px-12 lg:pb-12 lg:pt-6 lg:text-base">
      <SidebarNavItem
        title={t("Add Account")}
        to="/accounts/add"
        onClick={handleAddAccountClick}
        icon={<PlusIcon />}
      />
      <SidebarNavItem
        title={t("Portfolio")}
        to="/portfolio"
        onClick={handlePortfolioClick}
        icon={<PieChartIcon />}
      />
      {showBuyCryptoButton && (
        <SidebarNavItem
          title={t("Buy Crypto")}
          onClick={handleBuyClick}
          icon={<CreditCardIcon />}
        />
      )}
      {showStaking && (
        <SidebarNavItem
          title={t("Staking")}
          onClick={handleStakingClick}
          isExternalLink
          icon={<ZapIcon />}
        />
      )}
      <SidebarNavItem
        title={t("Transport")}
        onClick={handleTransportClick}
        isExternalLink
        icon={<RepeatIcon />}
      />
      <SidebarNavItem
        title={t("NFTs")}
        onClick={handleNftsClick}
        icon={<ImageIcon />}
        isExternalLink
      />
      <SidebarNavItem
        title={t("Crowdloans")}
        onClick={handleCrowdloansClick}
        icon={<StarIcon />}
        isExternalLink
      />
      {showTxHistory && (
        <SidebarNavItem
          title={t("Transaction History")}
          onClick={handleTxHistoryClick}
          icon={<HistoryIcon />}
          isExternalLink
        />
      )}
      <SidebarNavItem
        title={t("Settings")}
        to="/settings/general"
        onClick={handleSettingsClick}
        icon={<SettingsIcon />}
      />
      {isSnoozed && (
        <SidebarNavItem
          title={t("Backup Wallet")}
          // show only on large screens
          className="!hidden lg:!flex"
          onClick={handleBackupClick}
          icon={<DownloadAlertIcon />}
        />
      )}
    </Nav>
  )
}
