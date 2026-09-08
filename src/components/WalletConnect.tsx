import React, { useState } from 'react';
import { Wallet, LogOut, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface WalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  network: string;
  isLaceAvailable: boolean;
  isSimulated: boolean;
  error: string | null;
  onConnect: (forceSimulation?: boolean) => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  isConnected,
  isConnecting,
  walletAddress,
  network,
  isLaceAvailable,
  isSimulated,
  error,
  onConnect,
  onDisconnect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length <= 16) return addr;
    return `${addr.slice(0, 12)}...${addr.slice(-6)}`;
  };

  return (
    <div className="wallet-card">
      <div className="wallet-card-header">
        <div className="wallet-badge-group">
          <div className="wallet-icon-wrapper">
            <Wallet className="wallet-header-icon" />
          </div>
          <div>
            <h3 className="wallet-title">Lace Wallet Integration</h3>
            <p className="wallet-subtitle">Midnight Preprod DApp Connector</p>
          </div>
        </div>

        <div className="network-tag">
          <span className="network-dot"></span>
          <span className="network-text">{network}</span>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle className="alert-icon" />
          <div className="alert-content">
            <p className="alert-title">Wallet Error</p>
            <p className="alert-desc">{error}</p>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="wallet-connected-body">
          <div className="wallet-status-bar">
            <div className="status-indicator">
              <CheckCircle2 className="status-icon active" />
              <span className="status-text">Connected to Lace</span>
            </div>
            {isSimulated && (
              <span className="sim-badge" title="Running in simulated mode for testing">
                Demo Mode
              </span>
            )}
          </div>

          <div className="address-display-box">
            <div className="address-label-row">
              <span className="field-label">Connected Wallet Address</span>
              <button
                type="button"
                className="copy-btn"
                onClick={handleCopy}
                title="Copy full address"
                id="btn-copy-address"
              >
                {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="address-value" title={walletAddress || ''}>
              <code>{truncateAddress(walletAddress || '')}</code>
            </div>
          </div>

          <div className="wallet-action-row">
            <button
              type="button"
              className="btn btn-secondary disconnect-btn"
              onClick={onDisconnect}
              id="btn-disconnect-wallet"
            >
              <LogOut size={16} />
              <span>Disconnect Wallet</span>
            </button>
            <div className="shield-tag">
              <ShieldCheck size={14} />
              <span>Zero-Knowledge Shielded Active</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="wallet-disconnected-body">
          <p className="disconnected-desc">
            Connect your <strong>Lace Beta Wallet</strong> configured for Midnight Preprod to prove circuits and execute zero-knowledge smart contract transactions.
          </p>

          <div className="connect-actions-grid">
            <button
              type="button"
              className="btn btn-primary connect-btn"
              onClick={() => onConnect(false)}
              disabled={isConnecting}
              id="btn-connect-wallet"
            >
              <Wallet size={18} />
              <span>{isConnecting ? 'Connecting to Lace...' : 'Connect Lace Wallet'}</span>
            </button>

            {!isLaceAvailable && (
              <button
                type="button"
                className="btn btn-ghost sim-connect-btn"
                onClick={() => onConnect(true)}
                disabled={isConnecting}
                id="btn-connect-simulated"
                title="Review without extension installed"
              >
                <span>Launch Interactive Demo Mode</span>
              </button>
            )}
          </div>

          {!isLaceAvailable && (
            <div className="install-notice">
              <span>Don't have Lace yet?</span>
              <a
                href="https://www.lace.io/"
                target="_blank"
                rel="noreferrer"
                className="external-link"
              >
                Download Lace Beta Extension <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
