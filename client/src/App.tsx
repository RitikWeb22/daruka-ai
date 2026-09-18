import React, { useState } from 'react';
import { sendChatMessage, resetChatSession } from './services/api';
import type { EnvironmentalState, StructuredResponse, ScientificEvidenceItem, CausalLink } from './types/environmental';
import { StateViewer } from './components/EnvironmentalState/StateViewer';
import { CausalGraph } from './components/ReasoningGraph/CausalGraph';
import { ChatContainer } from './components/Chat/ChatContainer';
import { EvidenceModal } from './components/EvidenceCard/EvidenceModal';
import { CorpusViewerModal } from './components/EvidenceCard/CorpusViewerModal';
import { Globe2, ShieldCheck, Database, Layers, Sparkles, RefreshCw } from 'lucide-react';
import './App.css';

const defaultState: EnvironmentalState = {
  soil: {},
  land_use: {},
  climate: {},
  biodiversity: {},
  human_impact: {}
};

export const App: React.FC = () => {
  const [sessionId] = useState(() => `session-${Math.random().toString(36).substring(2, 9)}`);
  const [messages, setMessages] = useState<any[]>([]);
  const [environmentalState, setEnvironmentalState] = useState<EnvironmentalState>(defaultState);
  const [completeness, setCompleteness] = useState({
    score: 0,
    available_variables: [] as string[],
    missing_critical_variables: [] as string[],
    is_sufficient: false
  });
  const [causalLinks, setCausalLinks] = useState<CausalLink[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<ScientificEvidenceItem | null>(null);
  const [isCorpusOpen, setIsCorpusOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string | object) => {
    setIsLoading(true);
    const displayText = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    // Add user turn
    const userTurn = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: displayText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userTurn]);

    try {
      const response: StructuredResponse = await sendChatMessage({
        message: content,
        sessionId
      });

      // Update Environmental state and diagnostic models
      setEnvironmentalState(response.environmental_state);
      setCompleteness(response.completeness);
      setCausalLinks(response.reasoning_graph || []);

      // Add assistant turn
      const assistantTurn = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        recommendations: response.recommendations,
        clarifyingQuestions: response.clarifying_questions,
        completenessScore: response.completeness.score,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantTurn]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorTurn = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        content: `**System Error:** ${err.message || 'Failed to communicate with Environmental Intelligence Engine.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetChatSession(sessionId);
      setMessages([]);
      setEnvironmentalState(defaultState);
      setCompleteness({
        score: 0,
        available_variables: [],
        missing_critical_variables: [],
        is_sufficient: false
      });
      setCausalLinks([]);
    } catch (err) {
      console.error('Failed to reset session:', err);
    }
  };

  return (
    <div className="darukaa-app">
      {/* Production Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="flex items-center gap-3">
            <div className="brand-logo">
              <Globe2 size={24} className="text-emerald animate-pulse-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="brand-title">Darukaa.Earth</h1>
                <span className="badge badge-primary">Biodiversity Intelligence</span>
              </div>
              <p className="brand-subtitle">AI Environmental Scientist & Multi-Variable Ecological Diagnostics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-corpus-header"
              onClick={() => setIsCorpusOpen(true)}
              title="Inspect Peer-Reviewed Evidence Database"
            >
              <Database size={15} className="text-purple" />
              <span>Scientific Evidence Library</span>
            </button>

            <button
              className="btn-icon"
              onClick={handleReset}
              title="Reset Environmental State"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <main className="app-main">
        {/* System Intelligence Banner */}
        <section className="production-status-bar">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="status-indicator">
              <span className="status-dot online"></span>
              <span className="text-xs font-semibold text-primary">Intelligence Engine: Online</span>
            </div>
            <div className="header-chip">
              <Layers size={13} className="text-emerald" />
              <span>Causal Dependency Graph Active</span>
            </div>
            <div className="header-chip">
              <ShieldCheck size={13} className="text-blue" />
              <span>Grounded in FAO, IPCC, UNEP & IPBES</span>
            </div>
            <div className="header-chip">
              <Sparkles size={13} className="text-amber" />
              <span>Numerical Claim Guardrails Enforced</span>
            </div>
          </div>
        </section>

        {/* 2-Column Split: Left Chat Stream, Right State & Causal Intelligence */}
        <section className="split-layout">
          {/* Left Column: Conversational Scientist Interface */}
          <div className="layout-col left-col">
            <ChatContainer
              messages={messages}
              onSendMessage={handleSendMessage}
              onReset={handleReset}
              onViewEvidence={setSelectedEvidence}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Environmental Knowledge Model & Active Causal Graph */}
          <div className="layout-col right-col">
            <StateViewer
              state={environmentalState}
              completeness={completeness}
            />
            
            <div className="mt-4">
              <CausalGraph causalLinks={causalLinks} />
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <EvidenceModal
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />

      <CorpusViewerModal
        isOpen={isCorpusOpen}
        onClose={() => setIsCorpusOpen(false)}
      />
    </div>
  );
};

export default App;
