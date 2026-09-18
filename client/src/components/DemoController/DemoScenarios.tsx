import React from 'react';
import { PlayCircle, HelpCircle, GitMerge, RefreshCw, Database } from 'lucide-react';

interface Props {
  onRunScenario: (scenarioNumber: number) => void;
  onOpenCorpus: () => void;
  isLoading: boolean;
}

export const DemoScenarios: React.FC<Props> = ({ onRunScenario, onOpenCorpus, isLoading }) => {
  return (
    <div className="demo-scenarios-card">
      <div className="flex-between mb-2">
        <div className="flex items-center gap-1.5">
          <PlayCircle size={18} className="text-emerald" />
          <h3 className="section-heading">Evaluation Demo Scenarios (Agents.md §47)</h3>
        </div>
        <span className="text-xs text-secondary">One-Click Demonstration</span>
      </div>

      <div className="demo-buttons-grid">
        {/* Demo 1 */}
        <button
          className="demo-btn"
          disabled={isLoading}
          onClick={() => onRunScenario(1)}
          title="Ask general declining biodiversity question to observe clarifying question engine"
        >
          <div className="demo-btn-icon">
            <HelpCircle size={16} className="text-amber" />
          </div>
          <div className="demo-btn-text">
            <span className="demo-title">Demo 1: Missing Data</span>
            <span className="demo-desc">"Biodiversity is declining" → triggers clarifying questions</span>
          </div>
        </button>

        {/* Demo 2 */}
        <button
          className="demo-btn"
          disabled={isLoading}
          onClick={() => onRunScenario(2)}
          title="Provide semi-arid, low rainfall, SOC 0.3%, wheat monoculture to observe multi-metric reasoning & RAG"
        >
          <div className="demo-btn-icon">
            <GitMerge size={16} className="text-emerald" />
          </div>
          <div className="demo-btn-text">
            <span className="demo-title">Demo 2: Multi-Metric Reasoning</span>
            <span className="demo-desc">Semi-arid + low SOC + wheat monoculture → 3-variable reasoning</span>
          </div>
        </button>

        {/* Demo 3 */}
        <button
          className="demo-btn"
          disabled={isLoading}
          onClick={() => onRunScenario(3)}
          title="Ask follow-up constraint 'What if I cannot change the wheat crop?'"
        >
          <div className="demo-btn-icon">
            <RefreshCw size={16} className="text-blue" />
          </div>
          <div className="demo-btn-text">
            <span className="demo-title">Demo 3: Constraint Follow-up</span>
            <span className="demo-desc">"Cannot change wheat" → retains state & adapts interventions</span>
          </div>
        </button>

        {/* Demo 4 */}
        <button
          className="demo-btn"
          disabled={isLoading}
          onClick={onOpenCorpus}
          title="Inspect indexed authoritative scientific sources from FAO, IPCC, UNEP, IPBES"
        >
          <div className="demo-btn-icon">
            <Database size={16} className="text-purple" />
          </div>
          <div className="demo-btn-text">
            <span className="demo-title">Demo 4: Scientific Corpus</span>
            <span className="demo-desc">Inspect indexed FAO, IPCC, UNEP, IPBES RAG documents</span>
          </div>
        </button>
      </div>
    </div>
  );
};
