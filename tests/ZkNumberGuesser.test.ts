import { describe, it, expect, beforeAll } from '@jest/globals';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
// Import actual compiled Compact contract and ledger binding
import { Contract, ledger } from '../managed/contract/index.js';
import { fetchLatestPreprodBlock, fetchContractStateFromIndexer } from '../src/services/indexerService.js';

describe('ZkNumberGuesser: Actual Compiled Contract & Midnight Preprod Integration', () => {
  const dummyCoinPublicKey = new Uint8Array(32);
  let contractInstance: any;
  let currentContractState: any;

  beforeAll(() => {
    // Invoke setNetworkId as required by Midnight.js
    setNetworkId('preprod');
    expect(getNetworkId()).toBe('preprod');

    // Instantiate actual compiled contract class
    contractInstance = new Contract({});
  });

  it('1. Contract Constructor & Initial State: Compiles with 0 attempts and unsolved', () => {
    const constructorContext = {
      initialZswapLocalState: {
        coinPublicKey: dummyCoinPublicKey,
        currentIndex: 0n,
        inputs: [],
        outputs: [],
      },
      initialPrivateState: undefined,
    };

    const initResult = contractInstance.initialState(constructorContext);
    expect(initResult).toBeDefined();
    expect(initResult.currentContractState).toBeDefined();

    currentContractState = initResult.currentContractState;

    // Decode public ledger state using actual Compact ledger() decoder
    const publicLedger = ledger(currentContractState.data);
    expect(publicLedger.is_solved).toBe(false);
    expect(publicLedger.attempts).toBe(0n);
  });

  it('2. Circuit Execution (Incorrect Guess): Increments attempts and preserves unsolved status', () => {
    const circuitContext = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      currentContractState.data,
      undefined
    );

    // Call actual compiled guess_number circuit with an incorrect guess (17)
    const result = contractInstance.circuits.guess_number(circuitContext, 17n);

    expect(result).toBeDefined();
    expect(result.proofData).toBeDefined();

    // Verify public transcript is generated
    expect(Array.isArray(result.proofData.publicTranscript)).toBe(true);

    // Update current state to circuit output state
    currentContractState.data = result.context.currentQueryContext.state;

    // Verify ledger state through Compact runtime
    const publicLedger = ledger(currentContractState.data);
    expect(publicLedger.is_solved).toBe(false);
    expect(publicLedger.attempts).toBe(1n);
  });

  it('3. Circuit Execution (Correct Secret Guess): Triggers is_solved = true on secret 42', () => {
    const circuitContext = compactRuntime.createCircuitContext(
      compactRuntime.dummyContractAddress(),
      dummyCoinPublicKey,
      currentContractState.data,
      undefined
    );

    // Call actual compiled guess_number circuit with winning secret (42)
    const result = contractInstance.circuits.guess_number(circuitContext, 42n);

    expect(result).toBeDefined();
    expect(result.proofData).toBeDefined();

    // Update current state to winning output state
    currentContractState.data = result.context.currentQueryContext.state;

    // Verify state transition: is_solved is now true!
    const publicLedger = ledger(currentContractState.data);
    expect(publicLedger.is_solved).toBe(true);
    expect(publicLedger.attempts).toBe(2n);
  });

  it('4. Privacy Model: Witness (guess) is strictly confidential and not stored in public ledger', () => {
    const publicLedger = ledger(currentContractState.data);
    const ledgerKeys = Object.keys(publicLedger);

    // Public ledger strictly only exposes 'is_solved' and 'attempts'
    expect(ledgerKeys).toContain('is_solved');
    expect(ledgerKeys).toContain('attempts');
    expect(ledgerKeys).not.toContain('guess');
    expect(ledgerKeys).not.toContain('secret_number');
    expect((publicLedger as any).guess).toBeUndefined();
  });

  it('5. Midnight.js CompiledContract Configuration: Validates contract container and vacant witnesses', () => {
    const compiled = CompiledContract.make('ZkNumberGuesser', Contract).pipe(
      CompiledContract.withVacantWitnesses,
      CompiledContract.withCompiledFileAssets('managed')
    );

    expect(compiled.tag).toBe('ZkNumberGuesser');
  });

  it('6. Midnight Preprod Indexer Integration: Connects and queries live network block & contract state', async () => {
    const latestBlock = await fetchLatestPreprodBlock();
    expect(latestBlock.height).toBeGreaterThan(0);
    expect(typeof latestBlock.hash).toBe('string');
    expect(latestBlock.hash.length).toBe(64);

    const contractAddress = '02005a7b8849b2f3e0981e4b98127390abef38192a74c09d81b7e4198274a102';
    const indexerState = await fetchContractStateFromIndexer(contractAddress);
    expect(indexerState).toBeDefined();
    expect(typeof indexerState.isSolved).toBe('boolean');
    expect(typeof indexerState.attempts).toBe('number');
  });
});
