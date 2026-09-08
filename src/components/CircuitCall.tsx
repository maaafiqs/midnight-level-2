import React, { useState } from 'react';
import { Sparkles, EyeOff, Loader2, CheckCircle, HelpCircle, Lock, RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TransactionRecord } from '../hooks/useMidnight';

interface CircuitCallProps {
  isConnected: boolean;
  contractAddress: string;
  contractState: {
    isSolved: boolean;
    attempts: number;
  };
  isProving: boolean;
  provingStep: string;
  lastTxResult: TransactionRecord | null;
  onCallCircuit: (guess: number) => Promise<{ success: boolean; isSolved: boolean; txHash: string; error?: string }>;
  onReset: () => void;
}

export const CircuitCall: React.FC<CircuitCallProps> = ({
  isConnected,
  contractAddress,
  contractState,
  isProving,
  provingStep,
  lastTxResult,
  onCallCircuit,
  onReset,
}) => {
  const [guessInput, setGuessInput] = useState<string>('42');
  const [callFeedback, setCallFeedback] = useState<{
    status: 'success' | 'incorrect' | null;
    message: string;
  }>({ status: null, message: '' });

  const handleExecuteCircuit = async (numberToGuess?: number) => {
    const val = numberToGuess !== undefined ? numberToGuess : parseInt(guessInput, 10);
    if (isNaN(val)) return;

    setCallFeedback({ status: null, message: '' });

    const result = await onCallCircuit(val);
    if (result.success) {
      if (result.isSolved) {
        setCallFeedback({
          status: 'success',
          message: 'Zero-Knowledge Proof Verified! The secret number was solved!',
        });
        // Trigger celebratory confetti
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#38bdf8', '#818cf8', '#c084fc'],
        });
      } else {
        setCallFeedback({
          status: 'incorrect',
          message: 'Proof Verified on Midnight Preprod! Number does not match secret, attempts incremented.',
        });
      }
    }
  };

  return (
    <div className="circuit-card">
      <div className="circuit-card-header">
        <div className="circuit-title-group">
          <div className="circuit-icon-box">
            <Sparkles className="circuit-header-icon" />
          </div>
          <div>
            <h3 className="circuit-title">Compact Circuit Prover</h3>
            <p className="circuit-subtitle">Circuit: <code>guess_number(guess: Uint&lt;32&gt;)</code></p>
          </div>
        </div>

        <div className="privacy-pill-badge">
          <EyeOff size={14} />
          <span>Proved without revealing your input</span>
        </div>
      </div>

      {/* Contract State & Info */}
      <div className="contract-overview-panel">
        <div className="state-stat-box">
          <span className="stat-label">Public Ledger State: Solved</span>
          <div className="stat-value-row">
            <span className={`status-pill ${contractState.isSolved ? 'solved' : 'unsolved'}`}>
              {contractState.isSolved ? 'SOLVED' : 'UNSOLVED'}
            </span>
          </div>
        </div>

        <div className="state-stat-box">
          <span className="stat-label">Total Verifiable Attempts</span>
          <div className="stat-value-row">
            <span className="attempts-count">{contractState.attempts}</span>
          </div>
        </div>

        <div className="state-stat-box full-span">
          <span className="stat-label">Preprod Contract Address</span>
          <div className="contract-addr-row">
            <code className="contract-addr-code">{contractAddress}</code>
            <a
              href="https://preprod.midnight.network"
              target="_blank"
              rel="noreferrer"
              className="explorer-link"
              title="View on Midnight Preprod Explorer"
            >
              Verify on-chain <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Circuit Proving Form */}
      <div className="proving-control-panel">
        <div className="input-group">
          <label htmlFor="input-secret-guess" className="input-label">
            <Lock size={14} className="lock-icon" />
            <span>Private Witness Value (Input evaluated only inside prover)</span>
          </label>
          <div className="input-row">
            <input
              id="input-secret-guess"
              type="number"
              min="0"
              max="1000"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              disabled={isProving || !isConnected}
              className="guess-input"
              placeholder="Enter private number..."
            />
            <button
              type="button"
              className="btn btn-primary prove-btn"
              disabled={isProving || !isConnected || !guessInput}
              onClick={() => handleExecuteCircuit()}
              id="btn-prove-circuit"
            >
              {isProving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Proving ZK Circuit...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Prove &amp; Submit Circuit</span>
                </>
              )}
            </button>
          </div>

          <div className="quick-test-row">
            <span className="quick-label">Quick Test Presets:</span>
            <button
              type="button"
              className="preset-btn"
              disabled={isProving || !isConnected}
              onClick={() => {
                setGuessInput('42');
                handleExecuteCircuit(42);
              }}
              title="Test the correct secret witness (42)"
            >
              Secret Guess (42)
            </button>
            <button
              type="button"
              className="preset-btn"
              disabled={isProving || !isConnected}
              onClick={() => {
                setGuessInput('17');
                handleExecuteCircuit(17);
              }}
              title="Test an incorrect secret witness (17)"
            >
              Incorrect Guess (17)
            </button>
            <button
              type="button"
              className="btn-ghost reset-btn"
              onClick={onReset}
              title="Reset state counter for demonstration"
            >
              <RotateCcw size={14} />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Proving Progress Indicator */}
        {isProving && (
          <div className="proving-progress-banner">
            <div className="progress-header">
              <Loader2 size={16} className="spin highlight-icon" />
              <span className="progress-title">Local Browser Proving in Progress</span>
            </div>
            <p className="progress-step-text">{provingStep}</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill animated"></div>
            </div>
          </div>
        )}

        {/* Call Result Feedback */}
        {callFeedback.status && (
          <div className={`feedback-card ${callFeedback.status}`}>
            <CheckCircle size={18} className="feedback-icon" />
            <div className="feedback-body">
              <p className="feedback-text">{callFeedback.message}</p>
              <span className="privacy-badge">
                Observable Privacy: Raw guess was NOT revealed on-chain.
              </span>
            </div>
          </div>
        )}

        {/* Last Submission On-Chain Info */}
        {lastTxResult && (
          <div className="latest-tx-summary">
            <div className="tx-summary-header">
              <span className="summary-title">Latest Verified Transaction</span>
              <span className="summary-block">Block #{lastTxResult.blockHeight}</span>
            </div>
            <div className="tx-summary-details">
              <div className="detail-row">
                <span className="d-label">Transaction Hash:</span>
                <code className="d-code">{lastTxResult.txHash}</code>
              </div>
              <div className="detail-row">
                <span className="d-label">Prover Computation Time:</span>
                <span className="d-val">{lastTxResult.proverDurationMs}ms</span>
              </div>
              <div className="detail-row">
                <span className="d-label">Circuit Public Output:</span>
                <span className="d-val highlight">
                  {lastTxResult.solved ? 'is_solved = true (Solved)' : 'is_solved = false, attempts++'}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="connect-prompt-overlay">
            <HelpCircle size={16} />
            <span>Connect your Lace wallet above to interact with this circuit</span>
          </div>
        )}
      </div>
    </div>
  );
};
