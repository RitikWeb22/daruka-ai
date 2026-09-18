import React from 'react';
import type { CausalLink } from '../../types/environmental';
import { GitFork, ArrowRight, Layers } from 'lucide-react';

interface Props {
  causalLinks: CausalLink[];
}

export const CausalGraph: React.FC<Props> = ({ causalLinks }) => {
  if (!causalLinks || causalLinks.length === 0) {
    return (
      <div className="causal-graph-empty">
        <GitFork size={24} className="text-muted" />
        <p className="text-sm text-secondary">No active causal chains triggered yet. Submit environmental conditions to observe multi-variable reasoning.</p>
      </div>
    );
  }

  return (
    <div className="causal-graph-card">
      <div className="flex-between mb-3">
        <div className="flex items-center gap-2">
          <GitFork size={18} className="text-emerald" />
          <h3 className="section-heading">Multi-Metric Causal Graph ({causalLinks.length} Active Mechanisms)</h3>
        </div>
        <span className="badge badge-info">Ecological Dependency Layer</span>
      </div>

      <div className="causal-links-list">
        {causalLinks.map((link, idx) => (
          <div key={idx} className="causal-chain-node">
            <div className="chain-top">
              <span className="chain-factor">{link.factor}</span>
              <ArrowRight size={14} className="text-secondary" />
              <span className="chain-effect">{link.effect}</span>
            </div>
            
            <p className="chain-mechanism">{link.mechanism}</p>

            <div className="chain-variables">
              <span className="text-xs text-secondary flex items-center gap-1">
                <Layers size={12} /> Connected:
              </span>
              {link.variables.map(v => (
                <span key={v} className="var-chip">{v.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
