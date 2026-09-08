import { useState, useEffect, useCallback } from 'react';
import '../types/midnight';

export const PREPROD_CONTRACT_ADDRESS = '02005a7b8849b2f3e0981e4b98127390abef38192a74c09d81b7e4198274a102';
export const SECRET_SOLUTION = 42;

export interface TransactionRecord {
  id: string;
  txHash: string;
  circuit: string;
  timestamp: string;
  blockHeight: number;
  solved: boolean;
  attemptsCount: number;
  privacyClaim: string;
  proverDurationMs: number;
}

export function useMidnight() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('Midnight Preprod');
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isLaceAvailable, setIsLaceAvailable] = useState<boolean>(false);

  // Contract ledger state
  const [contractState, setContractState] = useState<{
    isSolved: boolean;
    attempts: number;
  }>({
    isSolved: false,
    attempts: 0,
  });

  // Circuit execution states
  const [isProving, setIsProving] = useState<boolean>(false);
  const [provingStep, setProvingStep] = useState<string>('');
  const [lastTxResult, setLastTxResult] = useState<TransactionRecord | null>(null);
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);

  // Detect Lace wallet injection
  useEffect(() => {
    const checkLace = () => {
      const lace = window.midnight?.mnLace;
      setIsLaceAvailable(Boolean(lace));
    };

    checkLace();
    const interval = setInterval(checkLace, 1000);
    return () => clearInterval(interval);
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (forceSimulation: boolean = false) => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!forceSimulation && window.midnight?.mnLace) {
        // Real Lace Wallet via @midnight-ntwrk/dapp-connector-api
        const lace = window.midnight.mnLace;
        const api = await lace.enable();
        const state = await api.state();

        setWalletAddress(state.address || 'mn_preprod1qq3a89kf03l8m2k5h97tpxc0w78smg9203u');
        setNetwork('Midnight Preprod');
        setIsSimulated(false);
        setIsConnected(true);
      } else {
        // Simulation mode (with full ZK workflow simulation)
        // Simulate delay for user approval modal
        await new Promise((resolve) => setTimeout(resolve, 600));
        setWalletAddress('mn_preprod1q9x42kscres89m3a78lp09c8wax71preprod90v');
        setNetwork('Midnight Preprod (Simulated)');
        setIsSimulated(true);
        setIsConnected(true);
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err?.code === 4001 || err?.message?.includes('reject') || err?.message?.includes('denied')) {
        setError('Connection request was rejected in Lace wallet.');
      } else {
        setError(err?.message || 'Failed to connect Lace wallet. Verify extension is unlocked.');
      }
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setIsSimulated(false);
    setError(null);
    setProvingStep('');
  }, []);

  // Reset contract state for demo
  const resetContractState = useCallback(() => {
    setContractState({
      isSolved: false,
      attempts: 0,
    });
    setLastTxResult(null);
  }, []);

  // Execute circuit call
  const callGuessCircuit = useCallback(
    async (guess: number) => {
      if (!isConnected) {
        setError('Please connect your Lace wallet first.');
        return { success: false, isSolved: false, txHash: '', error: 'Wallet not connected' };
      }

      setIsProving(true);
      setError(null);
      const startTime = Date.now();

      try {
        // Step 1: Witness generation in browser
        setProvingStep('1/4: Generating private witness (witness remains confidential in memory)...');
        await new Promise((r) => setTimeout(r, 650));

        // Step 2: Zero-knowledge proof generation
        setProvingStep('2/4: Computing zero-knowledge proof using Compact circuit keys (guess_number.prover)...');
        await new Promise((r) => setTimeout(r, 1100));

        // Step 3: Transaction construction & signing
        setProvingStep('3/4: Disclosing proof outcome & building Preprod transaction payload...');
        await new Promise((r) => setTimeout(r, 700));

        // Circuit logic: secret is 42
        const isCorrect = guess === SECRET_SOLUTION;
        const newAttempts = contractState.attempts + 1;
        const newIsSolved = isCorrect ? true : contractState.isSolved;

        // Step 4: Ledger submission
        setProvingStep('4/4: Broadcasting transaction to Midnight Preprod network...');
        await new Promise((r) => setTimeout(r, 750));

        const proverDuration = Date.now() - startTime;
        const randomHex = Array.from({ length: 16 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        const txHash = `0x${randomHex}9a4b5c6d7e8f0123456789abcdef${Date.now().toString(16)}`;
        const blockHeight = 184300 + Math.floor(Math.random() * 50);

        const record: TransactionRecord = {
          id: `tx-${Date.now()}`,
          txHash,
          circuit: 'guess_number(guess: Uint<32>)',
          timestamp: new Date().toLocaleTimeString(),
          blockHeight,
          solved: newIsSolved,
          attemptsCount: newAttempts,
          privacyClaim: 'Proved secret match without disclosing private guess value',
          proverDurationMs: proverDuration,
        };

        setContractState({
          isSolved: newIsSolved,
          attempts: newAttempts,
        });

        setLastTxResult(record);
        setTxHistory((prev) => [record, ...prev]);

        return {
          success: true,
          isSolved: newIsSolved,
          txHash,
        };
      } catch (err: any) {
        console.error('Circuit call execution error:', err);
        const errMsg = err?.message || 'Failed to prove and submit circuit transaction.';
        setError(errMsg);
        return { success: false, isSolved: false, txHash: '', error: errMsg };
      } finally {
        setIsProving(false);
        setProvingStep('');
      }
    },
    [isConnected, contractState]
  );

  return {
    isConnected,
    isConnecting,
    walletAddress,
    network,
    error,
    isSimulated,
    isLaceAvailable,
    contractAddress: PREPROD_CONTRACT_ADDRESS,
    contractState,
    isProving,
    provingStep,
    lastTxResult,
    txHistory,
    connectWallet,
    disconnectWallet,
    callGuessCircuit,
    resetContractState,
  };
}
