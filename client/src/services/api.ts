import type {
  StructuredResponse,
  ScientificCorpusDoc
} from '../types/environmental';

const API_BASE =
  import.meta.env.VITE_API_URL || 'https://daruka-ai.onrender.com';

export async function sendChatMessage(params: {
  message: string | object;
  sessionId?: string;
  reset?: boolean;
}): Promise<StructuredResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ error: 'Network response error' }));

    throw new Error(
      err.details ||
      err.error ||
      `HTTP ${response.status}`
    );
  }

  return response.json();
}

export async function resetChatSession(
  sessionId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/chat/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId })
  });

  if (!response.ok) {
    throw new Error(`Failed to reset chat: HTTP ${response.status}`);
  }
}

export async function getScientificCorpus(): Promise<{
  totalChunks: number;
  documents: ScientificCorpusDoc[];
}> {
  const response = await fetch(
    `${API_BASE}/api/environmental/corpus`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load scientific corpus: HTTP ${response.status}`
    );
  }

  return response.json();
}
