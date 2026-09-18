import React, { useEffect, useState } from 'react';
import type { ScientificCorpusDoc } from '../../types/environmental';
import { getScientificCorpus } from '../../services/api';
import { X, Database, ExternalLink, Tag, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CorpusViewerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [corpus, setCorpus] = useState<{ totalChunks: number; documents: ScientificCorpusDoc[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ScientificCorpusDoc | null>(null);

  useEffect(() => {
    if (isOpen && !corpus) {
      setLoading(true);
      getScientificCorpus()
        .then(data => {
          setCorpus(data);
          if (data.documents.length > 0) setSelectedDoc(data.documents[0]);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, corpus]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-purple" />
            <div>
              <h3 className="modal-title">Scientific RAG Knowledge Corpus (FAO, IPCC, UNEP, IPBES)</h3>
              <p className="text-xs text-secondary">Pre-indexed peer-reviewed scientific literature and reports ({corpus?.totalChunks || 0} chunks)</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="corpus-layout">
          {/* Documents Sidebar */}
          <div className="corpus-sidebar">
            <h4 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Indexed Documents</h4>
            {loading && <p className="text-sm text-secondary">Loading corpus...</p>}
            {corpus?.documents.map(doc => (
              <button
                key={doc.id}
                className={`corpus-doc-item ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex-between">
                  <span className="badge-source">{doc.source}</span>
                  <span className="text-xs text-muted">{doc.publication_year}</span>
                </div>
                <div className="doc-item-title">{doc.title}</div>
                <div className="text-xs text-secondary mt-1">{doc.chunkCount} indexed chunks</div>
              </button>
            ))}
          </div>

          {/* Selected Document Details & Chunks */}
          <div className="corpus-detail-view">
            {selectedDoc ? (
              <div>
                <div className="doc-detail-header">
                  <span className="badge-source-large">{selectedDoc.source}</span>
                  <h3 className="text-lg font-bold text-primary mt-2">{selectedDoc.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-secondary mt-1">
                    <span>Year: {selectedDoc.publication_year}</span>
                    <span>Region: {selectedDoc.region}</span>
                    <span>Credibility: <strong className="text-emerald uppercase">{selectedDoc.credibility}</strong></span>
                  </div>
                  <a
                    href={selectedDoc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-ext-link mt-2 inline-flex items-center gap-1 text-xs text-emerald hover:underline"
                  >
                    <span>View Official Publication</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <h4 className="text-sm font-semibold text-primary mt-4 mb-2 flex items-center gap-1.5">
                  <FileText size={16} className="text-emerald" />
                  Semantic Document Chunks & Extracted Variables:
                </h4>

                <div className="chunks-list">
                  {selectedDoc.chunks.map(chunk => (
                    <div key={chunk.chunk_id} className="chunk-box">
                      <div className="chunk-id-tag">{chunk.chunk_id}</div>
                      <p className="chunk-text">"{chunk.text}"</p>
                      <div className="chunk-vars">
                        <Tag size={12} className="text-muted" />
                        <span className="text-xs text-muted">Variables:</span>
                        {chunk.variables.map(v => (
                          <span key={v} className="chunk-var-badge">{v.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-secondary text-sm">Select a document from the left to view chunks.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
