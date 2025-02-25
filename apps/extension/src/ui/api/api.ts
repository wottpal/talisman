import { PORT_EXTENSION } from "@core/constants"
import MessageService from "@core/libs/MessageService"

import MessageTypes from "./types"

const port = chrome.runtime.connect({ name: PORT_EXTENSION })
const messageService = new MessageService({
  origin: "talisman-extension",
  messageSource: port,
})
port.onMessage.addListener(messageService.handleResponse)

export const api: MessageTypes = {
  unsubscribe: (id) => messageService.sendMessage("pri(unsubscribe)", { id }),
  // UNSORTED
  onboardCreatePassword: (pass, passConfirm) =>
    messageService.sendMessage("pri(app.onboardCreatePassword)", { pass, passConfirm }),
  authenticate: (pass) => messageService.sendMessage("pri(app.authenticate)", { pass }),
  lock: () => messageService.sendMessage("pri(app.lock)"),
  changePassword: (currentPw, newPw, newPwConfirm) =>
    messageService.sendMessage("pri(app.changePassword)", { currentPw, newPw, newPwConfirm }),
  checkPassword: (password) => messageService.sendMessage("pri(app.checkPassword)", { password }),
  authStatus: () => messageService.sendMessage("pri(app.authStatus)"),
  authStatusSubscribe: (cb) => messageService.subscribe("pri(app.authStatus.subscribe)", null, cb),
  dashboardOpen: (route) => messageService.sendMessage("pri(app.dashboardOpen)", { route }),
  onboardOpen: () => messageService.sendMessage("pri(app.onboardOpen)"),
  popupOpen: () => messageService.sendMessage("pri(app.popupOpen)"),
  promptLogin: (closeOnSuccess = false) =>
    messageService.sendMessage("pri(app.promptLogin)", closeOnSuccess),
  approveMetaRequest: (id) => messageService.sendMessage("pri(metadata.approve)", { id }),
  rejectMetaRequest: (id) => messageService.sendMessage("pri(metadata.reject)", { id }),
  allowPhishingSite: (url) => messageService.sendMessage("pri(app.phishing.addException)", { url }),

  // app messages -------------------------------------------------------
  modalOpen: (request) => messageService.sendMessage("pri(app.modalOpen.request)", request),
  modalOpenSubscribe: (cb) => messageService.subscribe("pri(app.modalOpen.subscribe)", null, cb),
  analyticsCapture: (request) => messageService.sendMessage("pri(app.analyticsCapture)", request),
  sendFundsOpen: (request = {}) => messageService.sendMessage("pri(app.sendFunds.open)", request),
  resetWallet: () => messageService.sendMessage("pri(app.resetWallet)"),
  subscribeRequests: (cb) => messageService.subscribe("pri(app.requests)", null, cb),

  // signing messages ------------------------------------------------
  cancelSignRequest: (id) => messageService.sendMessage("pri(signing.cancel)", { id }),
  approveSign: (id) =>
    messageService.sendMessage("pri(signing.approveSign)", {
      id,
    }),
  approveSignHardware: (id, signature) =>
    messageService.sendMessage("pri(signing.approveSign.hardware)", {
      id,
      signature,
    }),
  approveSignQr: (id, signature) =>
    messageService.sendMessage("pri(signing.approveSign.qr)", {
      id,
      signature,
    }),

  // encrypt messages -------------------------------------------------------
  approveEncrypt: (id) =>
    messageService.sendMessage("pri(encrypt.approveEncrypt)", {
      id,
    }),
  approveDecrypt: (id) =>
    messageService.sendMessage("pri(encrypt.approveDecrypt)", {
      id,
    }),
  cancelEncryptRequest: (id) => messageService.sendMessage("pri(encrypt.cancel)", { id }),

  // mnemonic messages -------------------------------------------------------
  mnemonicUnlock: (mnemonicId, password) =>
    messageService.sendMessage("pri(mnemonic.unlock)", { mnemonicId, password }),
  mnemonicConfirm: (mnemonicId, confirmed: boolean) =>
    messageService.sendMessage("pri(mnemonic.confirm)", { mnemonicId, confirmed }),
  mnemonicRename: (mnemonicId, name) =>
    messageService.sendMessage("pri(mnemonic.rename)", { mnemonicId, name }),
  mnemonicDelete: (mnemonicId) =>
    messageService.sendMessage("pri(mnemonic.delete)", { mnemonicId }),
  validateMnemonic: (mnemonic) =>
    messageService.sendMessage("pri(mnemonic.validateMnemonic)", mnemonic),
  setVerifierCertMnemonic: (certType, options) =>
    messageService.sendMessage("pri(mnemonic.setVerifierCertMnemonic)", {
      type: certType,
      options,
    }),

  // account messages ---------------------------------------------------
  accountCreate: (name, type, options) =>
    messageService.sendMessage("pri(accounts.create)", { name, type, ...options }),
  accountCreateFromSuri: (name, suri, type) =>
    messageService.sendMessage("pri(accounts.create.suri)", { name, suri, type }),
  accountCreateFromJson: (unlockedPairs) =>
    messageService.sendMessage("pri(accounts.create.json)", { unlockedPairs }),
  accountCreateLedger: ({ accountIndex, address, addressOffset, genesisHash, name }) =>
    messageService.sendMessage("pri(accounts.create.ledger.substrate)", {
      accountIndex,
      address,
      addressOffset,
      genesisHash,
      name,
    }),
  accountCreateLedgerEthereum: (name, address, path) =>
    messageService.sendMessage("pri(accounts.create.ledger.ethereum)", {
      name,
      address,
      path,
    }),
  accountCreateDcent: (name, address, type, path, tokenIds) =>
    messageService.sendMessage("pri(accounts.create.dcent)", {
      name,
      address,
      type,
      path,
      tokenIds,
    }),
  accountCreateQr: (name, address, genesisHash) =>
    messageService.sendMessage("pri(accounts.create.qr.substrate)", {
      name,
      address,
      genesisHash,
    }),
  accountCreateWatched: (name, address, isPortfolio) =>
    messageService.sendMessage("pri(accounts.create.watched)", {
      name,
      address,
      isPortfolio,
    }),
  accountsSubscribe: (cb) => messageService.subscribe("pri(accounts.subscribe)", null, cb),
  accountsCatalogSubscribe: (cb) =>
    messageService.subscribe("pri(accounts.catalog.subscribe)", null, cb),
  accountsCatalogRunActions: (actions) =>
    messageService.sendMessage("pri(accounts.catalog.runActions)", actions),
  accountsOnChainIdsResolveNames: (names) =>
    messageService.sendMessage("pri(accounts.onChainIds.resolveNames)", names),
  accountsOnChainIdsLookupAddresses: (addresses) =>
    messageService.sendMessage("pri(accounts.onChainIds.lookupAddresses)", addresses),
  accountForget: (address) => messageService.sendMessage("pri(accounts.forget)", { address }),
  accountExport: (address, password, exportPw) =>
    messageService.sendMessage("pri(accounts.export)", { address, password, exportPw }),
  accountExportPrivateKey: (address, password) =>
    messageService.sendMessage("pri(accounts.export.pk)", { address, password }),
  accountRename: (address, name) =>
    messageService.sendMessage("pri(accounts.rename)", { address, name }),
  accountExternalSetIsPortfolio: (address, isPortfolio) =>
    messageService.sendMessage("pri(accounts.external.setIsPortfolio)", { address, isPortfolio }),
  validateDerivationPath: (derivationPath, type) =>
    messageService.sendMessage("pri(accounts.validateDerivationPath)", { derivationPath, type }),
  addressLookup: (lookup) => messageService.sendMessage("pri(accounts.address.lookup)", lookup),
  getNextDerivationPath: (mnemonicId, type) =>
    messageService.sendMessage("pri(accounts.derivationPath.next)", { mnemonicId, type }),

  // balance messages ---------------------------------------------------
  getBalance: ({ chainId, evmNetworkId, tokenId, address }) =>
    messageService.sendMessage("pri(balances.get)", { chainId, evmNetworkId, tokenId, address }),
  getNomPoolStakedBalance: ({ chainId, addresses }) =>
    messageService.sendMessage("pri(balances.nompools.get)", { chainId, addresses }),
  balances: (cb) => messageService.subscribe("pri(balances.subscribe)", null, cb),
  balancesByParams: (addressesByChain, addressesAndEvmNetworks, addressesAndTokens, cb) =>
    messageService.subscribe(
      "pri(balances.byparams.subscribe)",
      {
        addressesByChain,
        addressesAndEvmNetworks,
        addressesAndTokens,
      },
      cb
    ),

  // authorized sites messages ------------------------------------------
  authorizedSites: () => messageService.sendMessage("pri(sites.list)"),
  authorizedSitesSubscribe: (cb) => messageService.subscribe("pri(sites.subscribe)", null, cb),
  authorizedSite: (id) => messageService.sendMessage("pri(sites.byid)", { id }),
  authorizedSiteSubscribe: (id, cb) =>
    messageService.subscribe("pri(sites.byid.subscribe)", { id }, cb),
  authorizedSiteForget: (id, type) => messageService.sendMessage("pri(sites.forget)", { id, type }),
  authorizedSiteUpdate: (id, authorisedSite) =>
    messageService.sendMessage("pri(sites.update)", { id, authorisedSite }),
  authorizedSitesDisconnectAll: (type) =>
    messageService.sendMessage("pri(sites.disconnect.all)", { type }),
  authorizedSitesForgetAll: (type) => messageService.sendMessage("pri(sites.forget.all)", { type }),

  // authorization requests messages ------------------------------------
  authrequestApprove: (id, addresses) =>
    messageService.sendMessage("pri(sites.requests.approve)", { id, addresses }),
  authrequestReject: (id) => messageService.sendMessage("pri(sites.requests.reject)", { id }),
  authrequestIgnore: (id) => messageService.sendMessage("pri(sites.requests.ignore)", { id }),

  // track metadata updates ----------------------------------------------
  metadataUpdatesSubscribe: (genesisHash, cb) =>
    messageService.subscribe("pri(metadata.updates.subscribe)", { id: genesisHash }, cb),

  // chain message types
  chains: (cb) => messageService.subscribe("pri(chains.subscribe)", null, cb),
  chainUpsert: (chain) => messageService.sendMessage("pri(chains.upsert)", chain),
  chainRemove: (id) => messageService.sendMessage("pri(chains.remove)", { id }),
  chainReset: (id) => messageService.sendMessage("pri(chains.reset)", { id }),
  generateChainSpecsQr: (genesisHash) =>
    messageService.sendMessage("pri(chains.generateQr.addNetworkSpecs)", { genesisHash }),
  generateChainMetadataQr: (genesisHash, specVersion) =>
    messageService.sendMessage("pri(chains.generateQr.updateNetworkMetadata)", {
      genesisHash,
      specVersion,
    }),

  // token message types
  tokens: (cb) => messageService.subscribe("pri(tokens.subscribe)", null, cb),

  // tokenRates message types
  tokenRates: (cb) => messageService.subscribe("pri(tokenRates.subscribe)", null, cb),

  // custom erc20 token management
  addCustomErc20Token: (token) => messageService.sendMessage("pri(tokens.erc20.custom.add)", token),
  removeCustomErc20Token: (id) =>
    messageService.sendMessage("pri(tokens.erc20.custom.remove)", { id }),

  // asset transfer messages
  assetTransfer: (chainId, tokenId, fromAddress, toAddress, amount, tip, method) =>
    messageService.sendMessage("pri(assets.transfer)", {
      chainId,
      tokenId,
      fromAddress,
      toAddress,
      amount,
      tip,
      method,
    }),
  assetTransferEth: (evmNetworkId, tokenId, fromAddress, toAddress, amount, gasSettings) =>
    messageService.sendMessage("pri(assets.transferEth)", {
      evmNetworkId,
      tokenId,
      fromAddress,
      toAddress,
      amount,
      gasSettings,
    }),
  assetTransferEthHardware: (evmNetworkId, tokenId, amount, to, unsigned, signedTransaction) =>
    messageService.sendMessage("pri(assets.transferEthHardware)", {
      evmNetworkId,
      tokenId,
      amount,
      to,
      unsigned,
      signedTransaction,
    }),
  assetTransferCheckFees: (chainId, tokenId, fromAddress, toAddress, amount, tip, method) =>
    messageService.sendMessage("pri(assets.transfer.checkFees)", {
      chainId,
      tokenId,
      fromAddress,
      toAddress,
      amount,
      tip,
      method,
    }),
  assetTransferApproveSign: (unsigned, signature, transferInfo) =>
    messageService.sendMessage("pri(assets.transfer.approveSign)", {
      unsigned,
      signature,
      transferInfo,
    }),

  // eth related messages
  ethSignAndSend: (unsigned, transferInfo) =>
    messageService.sendMessage("pri(eth.signing.signAndSend)", { unsigned, transferInfo }),
  ethSendSigned: (unsigned, signed, transferInfo) =>
    messageService.sendMessage("pri(eth.signing.sendSigned)", { unsigned, signed, transferInfo }),
  ethApproveSign: (id) =>
    messageService.sendMessage("pri(eth.signing.approveSign)", {
      id,
    }),
  ethApproveSignHardware: (id, signedPayload) =>
    messageService.sendMessage("pri(eth.signing.approveSignHardware)", {
      id,
      signedPayload,
    }),
  ethApproveSignAndSend: (id, transaction) =>
    messageService.sendMessage("pri(eth.signing.approveSignAndSend)", {
      id,
      transaction,
    }),
  ethApproveSignAndSendHardware: (id, unsigned, signedPayload) =>
    messageService.sendMessage("pri(eth.signing.approveSignAndSendHardware)", {
      id,
      unsigned,
      signedPayload,
    }),
  ethCancelSign: (id) =>
    messageService.sendMessage("pri(eth.signing.cancel)", {
      id,
    }),
  ethRequest: (request) => messageService.sendMessage("pri(eth.request)", request),
  ethGetTransactionsCount: (address, evmNetworkId) =>
    messageService.sendMessage("pri(eth.transactions.count)", { address, evmNetworkId }),
  ethNetworkAddGetRequests: () =>
    messageService.sendMessage("pri(eth.networks.add.requests)", null),
  ethNetworkAddApprove: (id) => messageService.sendMessage("pri(eth.networks.add.approve)", { id }),
  ethNetworkAddCancel: (id) => messageService.sendMessage("pri(eth.networks.add.cancel)", { id }),

  // ethereum network message types
  ethereumNetworks: (cb) => messageService.subscribe("pri(eth.networks.subscribe)", null, cb),
  ethNetworkUpsert: (network) => messageService.sendMessage("pri(eth.networks.upsert)", network),
  ethNetworkRemove: (id) => messageService.sendMessage("pri(eth.networks.remove)", { id }),
  ethNetworkReset: (id) => messageService.sendMessage("pri(eth.networks.reset)", { id }),

  // ethereum watch assets
  ethWatchAssetRequestApprove: (id) =>
    messageService.sendMessage("pri(eth.watchasset.requests.approve)", { id }),
  ethWatchAssetRequestCancel: (id) =>
    messageService.sendMessage("pri(eth.watchasset.requests.cancel)", { id }),

  // substrate rpc messages
  subSend: <T>(chainId: string, method: string, params: unknown[], isCacheable?: boolean) =>
    messageService.sendMessage("pri(substrate.rpc.send)", {
      chainId,
      method,
      params,
      isCacheable,
    }) as Promise<T>,
  subChainMetadata: (genesisHash, specVersion, blockHash) =>
    messageService.sendMessage("pri(substrate.metadata.get)", {
      genesisHash,
      specVersion,
      blockHash,
    }),
}
