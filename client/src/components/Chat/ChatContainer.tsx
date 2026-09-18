import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Code, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import type { RecommendationItem, ScientificEvidenceItem } from '../../types/environmental';
import { RecommendationCard } from '../RecommendationCard/RecommendationCard';

interface MessageTurn {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  recommendations?: RecommendationItem[];
  clarifyingQuestions?: string[];
  completenessScore?: number;
  timestamp: string;
}

interface Props {
  messages: MessageTurn[];
  onSendMessage: (content: string | object) => void;
  onReset: () => void;
  onViewEvidence: (evidence: ScientificEvidenceItem) => void;
  isLoading: boolean;
}

const SAMPLE_JSON_INPUT = JSON.stringify({
  "region": "semi-arid",
  "soil": {
    "ph": 7.8,
    "organic_carbon_percent": 0.3,
    "moisture_percent": 12
  },
  "land_use": {
    "crop": "wheat",
    "cropping_system": "monoculture"
  },
  "climate": {
    "rainfall": "low",
    "temperature_c": 31
  },
  "human_impact": {
    "pollution": "moderate",
    "deforestation": "low"
  }
}, null, 2);

// Lightweight markdown text renderer (handles **bold**, *italic*, links, headers)
function renderFormattedLine(line: string) {
  // Replace links [text](url)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineFormatting(line.substring(lastIndex, match.index)));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald hover:underline font-medium"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push(renderInlineFormatting(line.substring(lastIndex)));
  }

  return parts;
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Format **bold** and *italic*
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-primary">{token.slice(2, -2)}</strong>;
    } else if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={idx} className="text-secondary italic">{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

export const ChatContainer: React.FC<Props> = ({
  messages,
  onSendMessage,
  onReset,
  onViewEvidence,
  isLoading
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'json'>('text');
  const [textInput, setTextInput] = useState('');
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON_INPUT);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom when messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    if (inputMode === 'text') {
      if (!textInput.trim()) return;
      onSendMessage(textInput.trim());
      setTextInput('');
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        setJsonError(null);
        onSendMessage(parsed);
      } catch (err: any) {
        setJsonError('Invalid JSON format: ' + err.message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };


  return (
    <div className="chat-container">
      {/* Fixed Chat Header */}
      <div className="chat-header">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald" size={18} />
          <div>
            <h3 className="text-sm font-bold text-primary">Environmental Scientist Dialogue</h3>
            <p className="text-xs text-secondary">Grounded in empirical datasets (FAO, IPCC, UNEP, IPBES)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="input-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              <MessageSquare size={13} className="inline mr-1" />
              Text Mode
            </button>
            <button
              type="button"
              className={`mode-btn ${inputMode === 'json' ? 'active' : ''}`}
              onClick={() => setInputMode('json')}
            >
              <Code size={13} className="inline mr-1" />
              JSON Mode
            </button>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onReset}
            title="Reset Conversation & Environmental State"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Messages Stream */}
      <div className="chat-stream" ref={chatStreamRef}>
        {messages.length === 0 && (
          <div className="chat-welcome">
            <Sparkles className="text-emerald welcome-icon" size={32} />
            <h4 className="font-semibold text-primary">Darukaa.Earth Biodiversity Intelligence Active</h4>
            <p className="text-sm text-secondary max-w-md mt-1">
              Submit agro-climatic conditions or ecological inquiries in natural language or structured JSON. 
              The system analyzes multi-variable causal interactions and retrieves peer-reviewed scientific evidence before formulating interventions.
            </p>
            <div className="welcome-prompts">
              <span className="text-xs text-muted">Diagnostic Inquiries:</span>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => onSendMessage({
                  region: 'semi-arid',
                  soil: { organic_carbon_percent: 0.3, ph: 7.8 },
                  climate: { rainfall: 'low', temperature_c: 31 },
                  land_use: { crop: 'wheat', cropping_system: 'monoculture' }
                })}
              >
                Dryland Wheat Monoculture (Low SOC + Arid)
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => onSendMessage('Biodiversity is declining on my farmland. What should I change?')}
              >
                Farmland Biodiversity Decline Inquiry
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => onSendMessage('What if I cannot change the wheat crop? What interventions work?')}
              >
                Crop Constraint: Retaining Cash Crop
              </button>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`message-bubble ${msg.sender}`}>
            <div className="message-header">
              <span className="sender-tag">
                {msg.sender === 'user' ? 'Environmental Manager' : '🌱 AI Environmental Scientist'}
              </span>
              <span className="timestamp-tag">{msg.timestamp}</span>
            </div>

            {/* Formatted Markdown Content */}
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (trimmed.startsWith('## ')) {
                  return <h3 key={i} className="msg-h2">{renderFormattedLine(trimmed.replace('## ', ''))}</h3>;
                } else if (trimmed.startsWith('### ')) {
                  return <h4 key={i} className="msg-h3">{renderFormattedLine(trimmed.replace('### ', ''))}</h4>;
                } else if (trimmed.startsWith('#### ')) {
                  return <h5 key={i} className="msg-h4">{renderFormattedLine(trimmed.replace('#### ', ''))}</h5>;
                } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                  return <li key={i} className="msg-li">{renderFormattedLine(trimmed.replace(/^[•-]\s*/, ''))}</li>;
                } else if (trimmed === '') {
                  return <div key={i} className="msg-spacer" />;
                }
                return <p key={i} className="msg-p">{renderFormattedLine(line)}</p>;
              })}
            </div>

            {/* Interactive Clarifying Questions Badges */}
            {msg.clarifyingQuestions && msg.clarifyingQuestions.length > 0 && (
              <div className="clarifying-box">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 text-amber text-xs font-semibold">
                    <AlertCircle size={15} />
                    <span>Targeted Missing Variables — Click to Provide Context:</span>
                  </div>
                  <button
                    type="button"
                    className="quick-fill-btn"
                    onClick={() => onSendMessage({
                      region: 'semi-arid',
                      soil: { organic_carbon_percent: 0.3, ph: 7.8 },
                      climate: { rainfall: 'low', temperature_c: 31 },
                      land_use: { crop: 'wheat', cropping_system: 'monoculture' }
                    })}
                  >
                    ⚡ Calibrate Semi-Arid Wheat Profile
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {msg.clarifyingQuestions.map((q, idx) => {
                    const isSoc = q.toLowerCase().includes('carbon') || q.toLowerCase().includes('soc');
                    const isPh = q.toLowerCase().includes('ph');
                    const isRain = q.toLowerCase().includes('rainfall') || q.toLowerCase().includes('region');
                    const isCrop = q.toLowerCase().includes('crop') || q.toLowerCase().includes('management');
                    const isPesticide = q.toLowerCase().includes('pesticide');

                    return (
                      <div key={idx} className="clarify-item">
                        <div className="clarify-question-text font-medium text-xs mb-1 text-primary">{q}</div>
                        <div className="clarify-actions flex flex-wrap gap-1">
                          {isSoc && (
                            <>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Soil organic carbon is 0.3%')}>SOC 0.3% (Degraded)</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Soil organic carbon is 0.8%')}>SOC 0.8% (Moderate)</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Soil organic carbon is 1.5%')}>SOC 1.5% (Healthy)</button>
                            </>
                          )}
                          {isPh && (
                            <>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Soil pH is 6.5')}>pH 6.5 (Neutral)</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Soil pH is 7.8')}>pH 7.8 (Alkaline)</button>
                            </>
                          )}
                          {isRain && (
                            <>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Region is semi-arid with low rainfall')}>Semi-Arid (Low Rainfall)</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Region is temperate with moderate rainfall')}>Temperate (Moderate Rainfall)</button>
                            </>
                          )}
                          {isCrop && (
                            <>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('I grow wheat in a continuous monoculture')}>Wheat Monoculture</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('I practice crop rotation with wheat and legumes')}>Crop Rotation / Polyculture</button>
                            </>
                          )}
                          {isPesticide && (
                            <>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('High chemical pesticide intensity')}>High Pesticide Load</button>
                              <button type="button" className="clarify-chip-btn" onClick={() => onSendMessage('Zero to low chemical pesticide intensity')}>Low/Zero Pesticide</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Structured Recommendation Cards */}
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="recommendations-container mt-4">
                <h4 className="text-xs uppercase tracking-wider text-emerald font-bold mb-2">
                  Evidence-Backed Scientific Interventions ({msg.recommendations.length})
                </h4>
                <div className="space-y-3">
                  {msg.recommendations.map((rec, rIdx) => (
                    <RecommendationCard
                      key={rIdx}
                      recommendation={rec}
                      onViewEvidence={onViewEvidence}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message-bubble assistant loading-bubble">
            <div className="flex items-center gap-2 text-emerald text-sm">
              <span className="spinner" />
              <span>Synthesizing multi-variable relationships & retrieving FAO/IPCC evidence...</span>
            </div>
          </div>
        )}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>

      {/* Permanently Fixed Input Form at Bottom */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        {inputMode === 'text' ? (
          <div className="input-wrapper">
            <textarea
              className="chat-textarea"
              placeholder="Describe environmental conditions or ask an ecological question... (Press Enter to submit)"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              type="submit"
              className="btn-send"
              disabled={isLoading || !textInput.trim()}
              title="Submit Inquiry"
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div className="json-input-wrapper">
            <div className="flex-between mb-1">
              <span className="text-xs text-secondary font-mono">Structured JSON Input (Agents.md §3):</span>
              <button
                type="button"
                className="text-xs text-emerald hover:underline"
                onClick={() => setJsonInput(SAMPLE_JSON_INPUT)}
              >
                Load Section 3 Sample
              </button>
            </div>
            <textarea
              className="json-textarea font-mono"
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              rows={5}
            />
            {jsonError && <p className="text-xs text-rose mt-1">{jsonError}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={isLoading}
            >
              <Code size={16} className="inline mr-1" />
              Execute Structured Environmental Diagnosis
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
