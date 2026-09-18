import React from 'react';
import type { RecommendationItem, ScientificEvidenceItem } from '../../types/environmental';
import { Sprout, TrendingUp, TrendingDown, Clock, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';

interface Props {
  recommendation: RecommendationItem;
  onViewEvidence: (evidence: ScientificEvidenceItem) => void;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation, onViewEvidence }) => {
  const confidencePercent = typeof recommendation.confidence === 'number'
    ? Math.round(recommendation.confidence * 100)
    : recommendation.confidence;

  return (
    <div className="recommendation-card">
      <div className="rec-header">
        <div className="flex items-start gap-2">
          <Sprout className="text-emerald mt-1 shrink-0" size={20} />
          <div>
            <h4 className="rec-title">{recommendation.recommendation}</h4>
            <div className="rec-badges">
              <span className="badge badge-horizon">
                <Clock size={12} className="inline mr-1" />
                {recommendation.time_horizon_detail || recommendation.time_horizon}
              </span>
              <span className="badge badge-confidence">
                <ShieldCheck size={12} className="inline mr-1" />
                Confidence: {confidencePercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Why / Scientific Explanation */}
      <div className="rec-section">
        <h5 className="sub-title">Scientific Mechanism (Why)</h5>
        <p className="rec-reasoning">{recommendation.reasoning}</p>
      </div>

      {/* Directional Environmental Metrics */}
      <div className="rec-section">
        <h5 className="sub-title">Target Environmental Metrics</h5>
        <div className="metrics-grid">
          {recommendation.metrics.map((m, idx) => {
            const isUp = m.direction.includes('increase');
            const isDown = m.direction.includes('decrease');
            return (
              <div key={idx} className="metric-pill">
                <div className="flex items-center gap-1">
                  {isUp && <TrendingUp size={14} className="text-emerald" />}
                  {isDown && <TrendingDown size={14} className="text-amber" />}
                  {!isUp && !isDown && <span className="text-blue">↔</span>}
                  <span className="metric-name">{m.name.replace(/_/g, ' ')}</span>
                </div>
                <span className={`metric-dir ${isUp ? 'text-emerald' : isDown ? 'text-amber' : 'text-blue'}`}>
                  {m.direction.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Grounding */}
      {recommendation.evidence && recommendation.evidence.length > 0 && (
        <div className="rec-section">
          <h5 className="sub-title">Scientific Evidence Sources</h5>
          <div className="evidence-chips">
            {recommendation.evidence.map((ev, i) => (
              <button
                key={i}
                className="evidence-chip-btn"
                onClick={() => onViewEvidence(ev)}
                title="Click to view peer-reviewed evidence excerpt"
              >
                <span className="source-org">{ev.source}</span>
                <span className="source-year">({ev.publication_year || 'Study'})</span>
                <span className="source-title-short">{ev.title}</span>
                <ExternalLink size={12} className="ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainty & Caveats */}
      {recommendation.caveats_and_uncertainty && (
        <div className="rec-uncertainty">
          <AlertTriangle size={14} className="text-amber shrink-0 mt-0.5" />
          <p className="text-xs text-secondary leading-relaxed">
            <strong>Important Uncertainty:</strong> {recommendation.caveats_and_uncertainty}
          </p>
        </div>
      )}
    </div>
  );
};
