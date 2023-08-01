import { IdenticonType } from "@core/domains/accounts/types"
import { StorageProvider } from "@core/libs/Store"

export interface SettingsStoreData {
  useErrorTracking: boolean
  useTestnets: boolean
  identiconType: IdenticonType
  useAnalyticsTracking?: boolean // undefined during onboarding
  hideBalances: boolean
  allowNotifications: boolean
  selectedAccount?: string // undefined = show all accounts
  collapsedFolders?: string[] // persists the collapsed folders in the dashboard account picker
  autoLockTimeout: 0 | 300 | 1800 | 3600
  spiritClanFeatures: boolean
}

export class SettingsStore extends StorageProvider<SettingsStoreData> {}

export const DEFAULT_SETTINGS: SettingsStoreData = {
  useErrorTracking: true,
  useTestnets: false,
  identiconType: "talisman-orb",
  useAnalyticsTracking: undefined, // undefined for onboarding
  hideBalances: false,
  allowNotifications: true,
  autoLockTimeout: 0,
  spiritClanFeatures: true,
}

export const settingsStore = new SettingsStore("settings", DEFAULT_SETTINGS)
