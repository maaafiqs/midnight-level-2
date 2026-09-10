/**
 * Midnight DApp Connector SDK Type Integration
 *
 * Uses official types from @midnight-ntwrk/dapp-connector-api v4.x
 * The package's globals.d.ts declares window.midnight as { [key: string]: InitialAPI }
 * where the wallet key (e.g. 'mnLace') maps to an InitialAPI provider instance.
 *
 * Connection flow (SDK v4):
 *   const walletApi = window.midnight?.mnLace          // InitialAPI
 *   const connectedApi = await walletApi.connect(networkId)  // ConnectedAPI
 *   const state = await connectedApi.state()           // WalletConnectedAPI
 */

// Import SDK globals to extend window.midnight with official InitialAPI types
import '@midnight-ntwrk/dapp-connector-api';

// Re-export official SDK types for use throughout the app
export type {
  InitialAPI,
  ConnectedAPI,
  WalletConnectedAPI,
  Configuration,
  KeyMaterialProvider,
  ProvingProvider,
  TxStatus,
  HistoryEntry,
  ErrorCode,
  APIError,
} from '@midnight-ntwrk/dapp-connector-api';

export { ErrorCodes } from '@midnight-ntwrk/dapp-connector-api';

// Helper: Midnight network ID for Preprod
export const MIDNIGHT_NETWORK_ID = 'preprod';

// Helper: Wallet key injected by Lace into window.midnight
export const LACE_WALLET_KEY = 'mnLace';
