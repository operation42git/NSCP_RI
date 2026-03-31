import { IdentifiersSearchParams, IdentifiersResponse } from './identifiersSearchTypes';

const API_BASE = '/api/control/identifiers';

export async function postIdentifiersSearch(params: IdentifiersSearchParams): Promise<IdentifiersResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error('Search request failed');
  return response.json();
}

export async function getIdentifiersResult(requestId: string): Promise<IdentifiersResponse> {
  const response = await fetch(`${API_BASE}?requestId=${encodeURIComponent(requestId)}`);
  if (!response.ok) throw new Error('Failed to fetch result');
  return response.json();
}
