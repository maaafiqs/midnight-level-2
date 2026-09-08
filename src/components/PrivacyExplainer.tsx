import React from 'react';
import { Shield, Eye, EyeOff, CheckCircle2, FileCode } from 'lucide-react';

export const PrivacyExplainer: React.FC = () => {
  return (
    <div className="privacy-explainer-card">
      <div className="explainer-header">
        <div className="explainer-icon-box">
          <Shield className="explainer-icon" />
        </div>
        <div>
          <h3 className="explainer-title">Observable Privacy Architecture</h3>
          <p className="explainer-subtitle">Proved with Zero-Knowledge without revealing the witness</p>
        </div>
      </div>

      <div className="privacy-grid">
        <div className="privacy-box public-box">
          <div className="box-header">
            <Eye size={16} className="public-icon" />
            <h4>Public Ledger State (Visible On-Chain)</h4>
          </div>
          <ul className="privacy-list">
            <li>
              <strong><code>is_solved: Boolean</code></strong>
              <p>Indicates whether the puzzle has been successfully solved.</p>
            </li>
            <li>
              <strong><code>attempts: Uint&lt;32&gt;</code></strong>
              <p>Global verifiable counter incremented on every execution.</p>
            </li>
            <li>
              <strong>Verification Key</strong>
              <p>Public cryptographic parameters validating proof correctness.</p>
            </li>
          </ul>
        </div>

        <div className="privacy-box private-box">
          <div className="box-header">
            <EyeOff size={16} className="private-icon" />
            <h4>Private Witness (Never Exposed On-Chain)</h4>
          </div>
          <ul className="privacy-list">
            <li>
              <strong><code>guess: Uint&lt;32&gt;</code></strong>
              <p>The secret number submitted by the user stays in client memory.</p>
            </li>
            <li>
              <strong>Secret Evaluation Logic</strong>
              <p>The comparison <code>guess == secret_number</code> runs inside the ZK prover.</p>
            </li>
            <li>
              <strong>Zero Leakage</strong>
              <p>Neither validators nor block explorers can ever reconstruct the guess.</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="compact-snippet-section">
        <div className="snippet-header">
          <FileCode size={14} />
          <span>Compact Contract Logic (<code>contracts/ZkNumberGuesser.compact</code>)</span>
        </div>
        <pre className="compact-code">
{`export circuit guess_number(guess: Uint<32>): [] {
  const secret_number: Uint<32> = 42;
  const is_correct = guess == secret_number;
  const public_is_correct = disclose(is_correct); // Only boolean is disclosed!
  if (public_is_correct) {
    is_solved = true;
  }
  attempts = (attempts + 1) as Uint<32>;
}`}
        </pre>
      </div>

      <div className="claim-banner">
        <CheckCircle2 size={18} className="claim-icon" />
        <div className="claim-text">
          <strong>Privacy Claim: </strong>
          An on-chain observer or block validator can verify that a valid guess was submitted and whether it matched the secret, but CANNOT determine what number was guessed.
        </div>
      </div>
    </div>
  );
};
