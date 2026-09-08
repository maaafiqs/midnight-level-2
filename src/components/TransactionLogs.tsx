import React from 'react';
import { History, ShieldCheck, Clock, Layers } from 'lucide-react';
import { TransactionRecord } from '../hooks/useMidnight';

interface TransactionLogsProps {
  logs: TransactionRecord[];
}

export const TransactionLogs: React.FC<TransactionLogsProps> = ({ logs }) => {
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="tx-logs-card">
      <div className="tx-logs-header">
        <div className="tx-logs-title-group">
          <History size={18} className="tx-logs-icon" />
          <h3 className="tx-logs-title">Preprod Execution &amp; Proof Log</h3>
        </div>
        <span className="tx-count-tag">{logs.length} Recorded</span>
      </div>

      <div className="tx-list">
        {logs.map((tx) => (
          <div key={tx.id} className="tx-item">
            <div className="tx-main-row">
              <div className="tx-status-col">
                <span className={`tx-badge ${tx.solved ? 'solved-badge' : 'unsolved-badge'}`}>
                  {tx.solved ? 'Solved & Proved' : 'Proved Unsolved'}
                </span>
                <span className="tx-circuit">{tx.circuit}</span>
              </div>
              <div className="tx-time-col">
                <Clock size={12} />
                <span>{tx.timestamp}</span>
              </div>
            </div>

            <div className="tx-detail-grid">
              <div className="tx-grid-item">
                <span className="lbl">Transaction Hash:</span>
                <code className="val hash-val">{tx.txHash}</code>
              </div>
              <div className="tx-grid-item">
                <span className="lbl">Block:</span>
                <span className="val"><Layers size={12} /> #{tx.blockHeight}</span>
              </div>
              <div className="tx-grid-item">
                <span className="lbl">Proving Time:</span>
                <span className="val">{tx.proverDurationMs}ms</span>
              </div>
              <div className="tx-grid-item">
                <span className="lbl">Attempts State:</span>
                <span className="val">{tx.attemptsCount}</span>
              </div>
            </div>

            <div className="tx-privacy-note">
              <ShieldCheck size={13} className="sec-icon" />
              <span>{tx.privacyClaim}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
