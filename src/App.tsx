import React from 'react';
import { Moon, Sparkles, Github, ExternalLink } from 'lucide-react';
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import { PrivacyExplainer } from './components/PrivacyExplainer';
import { TransactionLogs } from './components/TransactionLogs';
import './styles/App.css';

export const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    walletAddress,
    network,
    error,
    isSimulated,
    isLaceAvailable,
    contractAddress,
    contractState,
    isProving,
    provingStep,
    lastTxResult,
    txHistory,
    connectWallet,
    disconnectWallet,
    callGuessCircuit,
    resetContractState,
  } = useMidnight();

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="crescent-logo-wrapper">
            <Moon className="crescent-icon" size={26} />
          </div>
          <div>
            <h1 className="brand-title">ZkNumberGuesser</h1>
            <p className="brand-subtitle">Level 2 — Waxing Crescent · Midnight Preprod</p>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge-level">Waxing Crescent</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-tag">
          <Sparkles size={14} />
          <span>First Face to the World</span>
        </div>
        <h2 className="hero-title">
          Smart Contract Wired to Lace Wallet &amp; Preprod
        </h2>
        <p className="hero-desc">
          The first thread of light. Proving zero-knowledge circuits directly from the browser,
          interfacing with the Midnight Compact contract on Preprod without disclosing private inputs.
        </p>
      </section>

      {/* Main Interactive Grid */}
      <main className="main-content-grid">
        {/* Left Column: Wallet Connection & Circuit Prover */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <WalletConnect
            isConnected={isConnected}
            isConnecting={isConnecting}
            walletAddress={walletAddress}
            network={network}
            isLaceAvailable={isLaceAvailable}
            isSimulated={isSimulated}
            error={error}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />

          <CircuitCall
            isConnected={isConnected}
            contractAddress={contractAddress}
            contractState={contractState}
            isProving={isProving}
            provingStep={provingStep}
            lastTxResult={lastTxResult}
            onCallCircuit={callGuessCircuit}
            onReset={resetContractState}
          />
        </div>

        {/* Right Column: Observable Privacy Architecture & Transaction Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <PrivacyExplainer />
          <TransactionLogs logs={txHistory} />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Midnight Builder Challenge — <strong>Level 2: Waxing Crescent Submission</strong>
        </p>
        <div className="footer-links">
          <a
            href="https://github.com/maaafiqs/midnight-level-2"
            target="_blank"
            rel="noreferrer"
            className="external-link"
          >
            <Github size={14} /> GitHub Repository
          </a>
          <span>·</span>
          <a
            href="https://preprod.midnight.network"
            target="_blank"
            rel="noreferrer"
            className="external-link"
          >
            Midnight Preprod Network <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
