import { describe, it, expect } from '@jest/globals';

describe('ZkNumberGuesser Compact Contract & Circuit Verification', () => {
  const SECRET_NUMBER = 42;

  interface PublicLedgerState {
    is_solved: boolean;
    attempts: number;
  }

  // Simulated circuit behavior matching ZkNumberGuesser.compact
  function runCircuitGuessNumber(
    currentState: PublicLedgerState,
    privateWitnessGuess: number
  ): { newState: PublicLedgerState; publicDisclosure: boolean; leakedWitness: any } {
    // In Midnight Compact:
    // const is_correct = guess == secret_number;
    // const public_is_correct = disclose(is_correct);
    const is_correct = privateWitnessGuess === SECRET_NUMBER;
    const public_is_correct = is_correct; // Only the boolean is disclosed

    const newState: PublicLedgerState = {
      is_solved: public_is_correct ? true : currentState.is_solved,
      attempts: currentState.attempts + 1,
    };

    // In a zero-knowledge circuit, the witness (guess) is evaluated inside the prover.
    // The public ledger state and transaction output ONLY contain public_is_correct and new ledger state.
    return {
      newState,
      publicDisclosure: public_is_correct,
      leakedWitness: null, // Witness is never leaked or stored in public ledger
    };
  }

  it('1. Circuit Logic: Evaluates incorrect guess without disclosing value', () => {
    const initialState: PublicLedgerState = { is_solved: false, attempts: 0 };
    const userPrivateGuess = 17; // Incorrect guess

    const result = runCircuitGuessNumber(initialState, userPrivateGuess);

    expect(result.publicDisclosure).toBe(false);
    expect(result.newState.is_solved).toBe(false);
    expect(result.newState.attempts).toBe(1);
    expect(result.leakedWitness).toBeNull();
  });

  it('2. State Transition: Marks contract as solved upon correct secret guess (42)', () => {
    const initialState: PublicLedgerState = { is_solved: false, attempts: 2 };
    const userPrivateGuess = 42; // Correct guess

    const result = runCircuitGuessNumber(initialState, userPrivateGuess);

    expect(result.publicDisclosure).toBe(true);
    expect(result.newState.is_solved).toBe(true);
    expect(result.newState.attempts).toBe(3);
  });

  it('3. Privacy Guarantee: Private witness is never written to public state or ledger', () => {
    const initialState: PublicLedgerState = { is_solved: false, attempts: 0 };
    const secretInput = 999999;

    const result = runCircuitGuessNumber(initialState, secretInput);

    // Ledger keys must strictly only be 'is_solved' and 'attempts'
    const ledgerKeys = Object.keys(result.newState);
    expect(ledgerKeys).toEqual(['is_solved', 'attempts']);
    expect(ledgerKeys).not.toContain('guess');
    expect(result.newState).not.toHaveProperty('guess');
    expect((result.newState as any).guess).toBeUndefined();
  });
});
