import { resolveApiUrl } from './nativeBridge';

export interface JulesStatusResponse {
  configured: boolean;
  endpoint: string;
  maskedKey: string | null;
  policyCompliant: boolean;
  envVarName: string;
  timestamp: string;
}

export interface JulesSource {
  name: string;
  id?: string;
  githubRepo?: {
    owner?: string;
    repo?: string;
  };
}

export interface JulesSourcesResponse {
  sources?: JulesSource[];
  nextPageToken?: string;
  error?: {
    code?: number;
    message?: string;
  };
}

export interface JulesSessionPayload {
  prompt: string;
  title?: string;
  sourceContext?: {
    source: string;
    githubRepoContext?: {
      startingBranch?: string;
    };
  };
}

export async function getJulesApiStatus(): Promise<JulesStatusResponse> {
  const res = await fetch(resolveApiUrl('/api/jules/status'));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function listJulesSources(): Promise<JulesSourcesResponse> {
  const res = await fetch(resolveApiUrl('/api/jules/sources'));
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  return data;
}

export async function createJulesSession(payload: JulesSessionPayload): Promise<unknown> {
  const res = await fetch(resolveApiUrl('/api/jules/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  return data;
}
