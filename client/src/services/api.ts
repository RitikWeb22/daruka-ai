import type { StructuredResponse, ScientificCorpusDoc } from '../types/environmental';

const API_BASE = '/api';

export async function sendChatMessage(params: {
  message: string | object;
  sessionId?: string;
  reset?: boolean;
}): Promise<StructuredResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network response error' }));
    throw new Error(err.details || err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function resetChatSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/chat/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
}

export async function getScientificCorpus(): Promise<{ totalChunks: number; documents: ScientificCorpusDoc[] }> {
  const response = await fetch(`${API_BASE}/environmental/corpus`);
  if (!response.ok) {
    throw new Error(`Failed to load scientific corpus: HTTP ${response.status}`);
  }
  return response.json();
}
