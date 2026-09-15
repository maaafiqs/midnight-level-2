/**
 * Midnight Preprod Indexer Service
 * Queries the public GraphQL indexer on Midnight Preprod to synchronize
 * on-chain smart contract state and transaction inclusion data.
 */

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const PREPROD_INDEXER_HTTP = 'https://indexer.preprod.midnight.network/api/v4/graphql';
export const PREPROD_INDEXER_WS = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
export const PREPROD_NETWORK_ID = 'preprod';

// Set global network ID for Midnight runtime & ledger APIs
setNetworkId(PREPROD_NETWORK_ID);

export interface IndexerContractState {
  isSolved: boolean;
  attempts: number;
  latestTxHash: string | null;
  blockHeight: number | null;
  rawStateHex: string | null;
  syncedAt: string;
}

const CONTRACT_ACTION_QUERY = `
  query GetContractState($address: HexEncoded!) {
    contractAction(address: $address) {
      address
      state
      zswapState
      transaction {
        hash
        block {
          height
          hash
          timestamp
        }
      }
      ... on ContractCall {
        entryPoint
      }
    }
  }
`;

const LATEST_BLOCK_QUERY = `
  query GetLatestBlock {
    block {
      height
      hash
      timestamp
    }
  }
`;

/**
 * Decode a hex-encoded state string into ledger state values.
 * In Compact contracts, public ledger values are encoded sequentially in cells:
 * cell 0 = is_solved (boolean, 1 byte)
 * cell 1 = attempts (uint32, 4 bytes)
 */
export function decodeContractState(stateHex: string): { isSolved: boolean; attempts: number } {
  try {
    const cleanHex = stateHex.startsWith('0x') ? stateHex.slice(2) : stateHex;
    const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

    if (bytes.length === 0) {
      return { isSolved: false, attempts: 0 };
    }

    // Try parsing Compact cell structures or raw byte sequences
    // Look for boolean flag and attempt counter in the payload
    let isSolved = false;
    let attempts = 0;

    // Search for non-zero boolean flag
    for (let i = 0; i < Math.min(bytes.length, 16); i++) {
      if (bytes[i] === 0x01 && (i === 0 || bytes[i - 1] === 0x00)) {
        isSolved = true;
        break;
      }
    }

    // Search for 32-bit counter in the state payload
    if (bytes.length >= 4) {
      // Find the last 4-byte chunk or scan for integer values
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let offset = bytes.length - 4; offset >= 0; offset -= 1) {
        const val = view.getUint32(offset, true);
        if (val > 0 && val < 1000000) {
          attempts = val;
          break;
        }
      }
    }

    return { isSolved, attempts };
  } catch (err) {
    console.warn('Failed to parse raw state hex from indexer:', err);
    return { isSolved: false, attempts: 0 };
  }
}

/**
 * Fetch the latest verified contract state from the Midnight Preprod indexer.
 */
export async function fetchContractStateFromIndexer(
  contractAddress: string
): Promise<IndexerContractState> {
  const response = await fetch(PREPROD_INDEXER_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CONTRACT_ACTION_QUERY,
      variables: { address: contractAddress },
    }),
  });

  if (!response.ok) {
    throw new Error(`Indexer HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Indexer GraphQL error: ${result.errors[0].message}`);
  }

  const action = result.data?.contractAction;

  if (!action) {
    // Contract has not yet been registered or deployed on this indexer instance
    return {
      isSolved: false,
      attempts: 0,
      latestTxHash: null,
      blockHeight: null,
      rawStateHex: null,
      syncedAt: new Date().toLocaleTimeString(),
    };
  }

  const decoded = decodeContractState(action.state || '');

  return {
    isSolved: decoded.isSolved,
    attempts: decoded.attempts,
    latestTxHash: action.transaction?.hash || null,
    blockHeight: action.transaction?.block?.height || null,
    rawStateHex: action.state || null,
    syncedAt: new Date().toLocaleTimeString(),
  };
}

/**
 * Fetch latest block height from the Midnight Preprod indexer to verify network health.
 */
export async function fetchLatestPreprodBlock(): Promise<{ height: number; hash: string }> {
  const response = await fetch(PREPROD_INDEXER_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: LATEST_BLOCK_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`Indexer block query HTTP ${response.status}`);
  }

  const result = await response.json();
  const block = result.data?.block;
  return {
    height: block?.height || 0,
    hash: block?.hash || '',
  };
}
