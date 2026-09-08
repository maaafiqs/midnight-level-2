export interface MidnightWalletAPI {
  apiVersion: string;
  name: string;
  icon?: string;
  isEnabled(): Promise<boolean>;
  enable(): Promise<DAppConnectorAPI>;
}

export interface DAppConnectorAPI {
  state(): Promise<{
    address: string;
    networkId?: string;
    balances?: Record<string, bigint>;
  }>;
  serviceUriConfig?(): Promise<{
    indexer?: string;
    proofServer?: string;
    node?: string;
  }>;
  signTransaction?(tx: any): Promise<any>;
  submitTransaction?(tx: any): Promise<string>;
}

export interface MidnightGlobal {
  mnLace?: MidnightWalletAPI;
  [key: string]: any;
}

declare global {
  interface Window {
    midnight?: MidnightGlobal;
  }
}

export {};
