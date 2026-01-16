/**
 * SECURE API CLIENT FOR CLIENT-ROLE USERS
 * 
 * SECURITY MODEL:
 * This module provides the ONLY approved way for client-facing code
 * to fetch data from the backend. All data is pre-filtered by the
 * secure-data-proxy edge function.
 * 
 * FORBIDDEN DATA (never returned to clients):
 * - AI model names, providers, token usage
 * - Latency metrics, performance diagnostics
 * - Internal IDs (external_call_id, external_agent_id)
 * - Encryption payloads/metadata
 * - Raw lead PII (phone numbers, emails)
 * - System prompts, agent configs
 * - API keys, webhook secrets
 * 
 * ENCRYPTED DATA (returned as encrypted payloads):
 * - Transcripts
 * - Summaries
 * - Notes
 * - Extracted data
 * 
 * These can only be decrypted via the decrypt-content edge function
 * which also enforces role-based access.
 */

import { supabase } from "@/integrations/supabase/client";

const SECURE_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-data-proxy`;

interface SecureApiOptions {
  action: string;
  params?: Record<string, string>;
}

async function fetchSecure<T>(options: SecureApiOptions): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const queryParams = new URLSearchParams({ action: options.action, ...options.params });
  const url = `${SECURE_PROXY_URL}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// ============================================
// CLIENT-SAFE DATA TYPES
// These types define what clients can see
// ============================================

export interface ClientSafeCall {
  id: string;
  status: string;
  connected: boolean;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  sentiment: string | null;
  summary: unknown; // Encrypted payload
  transcript: unknown; // Encrypted payload
  recording_url: string | null; // Proxy URL only
  // NEVER: external_call_id, metadata.token_usage, metadata.latency_ms
}

export interface ClientSafeAgent {
  id: string;
  agent_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  // NEVER: external_agent_id, system_prompt, agent_config
}

export interface ClientSafeCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_leads: number | null;
  contacted_leads: number | null;
  interested_leads: number | null;
  not_interested_leads: number | null;
  partially_interested_leads: number | null;
  concurrency_level: number;
  created_at: string;
  updated_at: string;
  // NEVER: google_sheet_id, api_endpoint, api_key, api_headers
}

export interface ClientSafeLead {
  id: string;
  name: string;
  stage: string;
  interest_level: string | null;
  call_status: string | null;
  call_duration: number | null;
  call_sentiment: string | null;
  created_at: string;
  updated_at: string;
  // NEVER: phone_number (raw), email (raw), custom_fields, call_summary (raw)
}

// ============================================
// SECURE API FUNCTIONS
// ============================================

/**
 * Fetch calls for the authenticated client
 * Returns only client-safe data
 */
export async function fetchClientCalls(startDate?: string): Promise<ClientSafeCall[]> {
  return fetchSecure<ClientSafeCall[]>({
    action: "client_calls",
    params: startDate ? { start_date: startDate } : undefined,
  });
}

/**
 * Fetch agents for the authenticated client
 * Returns only client-safe data
 */
export async function fetchClientAgents(): Promise<ClientSafeAgent[]> {
  return fetchSecure<ClientSafeAgent[]>({
    action: "client_agents",
  });
}

/**
 * Fetch campaigns for the authenticated client
 * Returns only client-safe data
 */
export async function fetchClientCampaigns(): Promise<ClientSafeCampaign[]> {
  return fetchSecure<ClientSafeCampaign[]>({
    action: "client_campaigns",
  });
}

/**
 * Fetch leads for a campaign owned by the authenticated client
 * Returns only client-safe data
 */
export async function fetchClientLeads(campaignId: string): Promise<ClientSafeLead[]> {
  return fetchSecure<ClientSafeLead[]>({
    action: "client_leads",
    params: { campaign_id: campaignId },
  });
}

/**
 * Get recording URL for a call owned by the client
 * Returns proxied URL that requires authentication
 */
export async function getClientRecordingUrl(callId: string): Promise<{ url: string; call_id: string }> {
  return fetchSecure<{ url: string; call_id: string }>({
    action: "get_call_recording",
    params: { call_id: callId },
  });
}
