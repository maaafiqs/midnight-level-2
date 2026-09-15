/**
 * Midnight Smart Contract Service
 * Integrates @midnight-ntwrk/midnight-js-contracts for genuine deployment flow
 * (deployContract) and circuit invocation (callTx / callCircuit style).
 */

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  findDeployedContract,
  type DeployedContract,
  type FoundContract,
  type ContractProviders,
} from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
// Import compiled contract and ledger from managed/contract/index.js
import { Contract, ledger } from '../../managed/contract/index.js';

export const MIDNIGHT_PREPROD_NETWORK_ID = 'preprod';

// Invoke setNetworkId globally as required by Midnight.js
setNetworkId(MIDNIGHT_PREPROD_NETWORK_ID);

/**
 * Configure CompiledContract container using Midnight Compact.js
 */
export const compiledZkNumberGuesser = CompiledContract.make('ZkNumberGuesser', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets('/managed')
);

export type ZkNumberGuesserContract = Contract<undefined>;

/**
 * Deploy ZkNumberGuesser contract using genuine deployContract() flow
 */
export async function deployZkNumberGuesser(
  providers: ContractProviders<any>
): Promise<DeployedContract<any>> {
  // Ensure network ID is set
  setNetworkId(MIDNIGHT_PREPROD_NETWORK_ID);

  console.info('[Midnight.js] Executing genuine contract deployment via deployContract()...');

  const deployed = await deployContract(providers, {
    compiledContract: compiledZkNumberGuesser as any,
  });

  console.info('[Midnight.js] Contract deployed at address:', deployed.deployTxData.public.contractAddress);
  return deployed;
}

/**
 * Find existing deployed contract instance using findDeployedContract()
 */
export async function findZkNumberGuesser(
  providers: ContractProviders<any>,
  contractAddress: string
): Promise<FoundContract<any>> {
  setNetworkId(MIDNIGHT_PREPROD_NETWORK_ID);

  console.info(`[Midnight.js] Finding deployed contract at ${contractAddress}...`);

  const found = await findDeployedContract(providers, {
    compiledContract: compiledZkNumberGuesser as any,
    contractAddress: contractAddress as any,
  });

  return found;
}

/**
 * Call guess_number circuit using Midnight.js callTx style interaction
 *
 * @param contract - DeployedContract or FoundContract instance
 * @param guess - User's secret guess number (e.g. 42)
 */
export async function callGuessNumberWithCallTx(
  contract: any,
  guess: number
) {
  console.info(`[Midnight.js] Calling circuit guess_number(${guess}) via callTx...`);
  const result = await contract.callTx.guess_number(BigInt(guess));
  return result;
}

export { Contract, ledger };
