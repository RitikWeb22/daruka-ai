import React from 'react';
import type { ScientificEvidenceItem } from '../../types/environmental';
import { X, BookOpen, ExternalLink, CheckCircle } from 'lucide-react';

interface Props {
  evidence: ScientificEvidenceItem | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-emerald" />
            <h3 className="modal-title">Scientific Evidence Inspection</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="evidence-meta-banner">
            <div className="meta-item">
              <span className="meta-label">Authoritative Institution:</span>
              <span className="meta-val font-semibold text-emerald">{evidence.source}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Publication Year:</span>
              <span className="meta-val">{evidence.publication_year || 'Recent Assessment'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Relevance Score:</span>
              <span className="meta-val text-blue">{Math.round(evidence.relevance * 100)}%</span>
            </div>
          </div>

          <div className="modal-section">
            <h4 className="modal-sec-title">Document Title</h4>
            <p className="font-medium text-primary text-base">{evidence.title}</p>
          </div>

          <div className="modal-section">
            <h4 className="modal-sec-title">Indexed Scientific Excerpt & Empirical Findings</h4>
            <blockquote className="evidence-excerpt-box">
              "{evidence.excerpt}"
            </blockquote>
          </div>

          <div className="modal-section">
            <h4 className="modal-sec-title">Environmental Variables Addressed</h4>
            <div className="var-tags-row">
              {evidence.variables_addressed.map(v => (
                <span key={v} className="var-chip-green">
                  <CheckCircle size={12} className="inline mr-1" />
                  {v.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <a
              href={evidence.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex items-center gap-1.5"
            >
              <span>Read Original Official Document</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
