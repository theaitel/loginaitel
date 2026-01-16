/**
 * ROLE-BASED RESPONSE FILTERING UTILITIES
 * 
 * SECURITY MODEL:
 * - Client users receive ONLY business-level data they own
 * - Admin/Engineer users receive full data with encrypted sensitive fields
 * - Internal system data is NEVER exposed to clients
 * 
 * FORBIDDEN FOR CLIENTS:
 * - AI model names, providers, token usage
 * - Latency metrics, performance diagnostics
 * - Internal IDs (external_call_id, external_agent_id)
 * - Encryption payloads metadata
 * - Raw lead information beyond what they own
 * - System configuration details
 */

import { encryptData, type EncryptedPayload } from "./encryption.ts";

export type UserRole = "admin" | "engineer" | "client";

// Fields that MUST be removed for client users
const CLIENT_FORBIDDEN_FIELDS = [
  // AI/Model internals
  "model_name",
  "model_provider", 
  "llm_provider",
  "llm_model",
  "ai_model",
  "token_usage",
  "tokens_used",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
  
  // Performance/Diagnostics
  "latency_ms",
  "processing_time_ms",
  "response_time_ms",
  "api_latency",
  "ttfb_ms",
  "tts_latency",
  "stt_latency",
  "llm_latency",
  
  // Internal IDs
  "external_call_id",
  "external_agent_id",
  "external_batch_id",
  "provider_call_id",
  "provider_agent_id",
  "bolna_agent_id",
  "aitel_agent_id",
  
  // System config
  "system_prompt",
  "original_system_prompt",
  "current_system_prompt",
  "agent_config",
  "webhook_config",
  "api_key",
  "api_secret",
  
  // Encryption metadata
  "encryption_key_id",
  "encryption_version",
  "iv",
  "tag",
  "ciphertext",
  
  // Raw provider data
  "provider_response",
  "raw_response",
  "debug_info",
  "internal_notes",
  "admin_notes",
];

// Fields that should be masked for clients
const CLIENT_MASK_FIELDS = [
  "phone_number",
  "email",
  "full_name",
];

// Sensitive fields that require encryption even for admin
const ENCRYPT_FIELDS = [
  "transcript",
  "summary",
  "notes",
  "extracted_data",
];

/**
 * Mask phone number - last 4 digits only
 */
export function maskPhone(phone: string | null): string {
  if (!phone) return "****";
  if (phone.length <= 4) return "****";
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Mask email - first letter + domain only
 */
export function maskEmail(email: string | null): string {
  if (!email) return "***@***.***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***.***";
  return localPart[0] + "***@" + domain;
}

/**
 * Mask full name - initials only
 */
export function maskFullName(name: string | null): string {
  if (!name) return "***";
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p[0]?.toUpperCase() || "*").join(".") + ".";
}

/**
 * Mask UUID - first 8 chars only
 */
export function maskUuid(uuid: string | null): string {
  if (!uuid) return "********";
  return uuid.slice(0, 8) + "...";
}

/**
 * Create client-safe response schema
 * Removes all internal system data and masks sensitive fields
 */
export async function filterForClient<T extends Record<string, unknown>>(
  data: T,
  ownerId?: string,
  requesterId?: string
): Promise<Partial<T>> {
  const filtered: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip forbidden fields entirely
    if (CLIENT_FORBIDDEN_FIELDS.includes(key)) {
      continue;
    }
    
    // Handle nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      filtered[key] = await filterForClient(value as Record<string, unknown>, ownerId, requesterId);
      continue;
    }
    
    // Handle arrays of objects
    if (Array.isArray(value)) {
      filtered[key] = await Promise.all(
        value.map(async (item) => {
          if (item && typeof item === "object") {
            return await filterForClient(item as Record<string, unknown>, ownerId, requesterId);
          }
          return item;
        })
      );
      continue;
    }
    
    // Mask sensitive fields
    if (CLIENT_MASK_FIELDS.includes(key) && typeof value === "string") {
      if (key === "phone_number") {
        filtered[key] = maskPhone(value);
      } else if (key === "email") {
        filtered[key] = maskEmail(value);
      } else if (key === "full_name") {
        filtered[key] = maskFullName(value);
      }
      continue;
    }
    
    // Encrypt transcript/summary fields
    if (ENCRYPT_FIELDS.includes(key) && value) {
      const strValue = typeof value === "string" ? value : JSON.stringify(value);
      filtered[key] = await encryptData(strValue);
      continue;
    }
    
    // Pass through allowed fields
    filtered[key] = value;
  }
  
  return filtered as Partial<T>;
}

/**
 * Create admin/engineer response schema
 * Keeps internal data but encrypts sensitive content
 */
export async function filterForInternal<T extends Record<string, unknown>>(
  data: T,
  includeEncrypted: boolean = true
): Promise<T> {
  const result: Record<string, unknown> = { ...data };
  
  // Encrypt sensitive fields
  for (const field of ENCRYPT_FIELDS) {
    if (result[field]) {
      const value = result[field];
      const strValue = typeof value === "string" ? value : JSON.stringify(value);
      result[field] = await encryptData(strValue);
    }
  }
  
  // Mask external IDs for display
  if (result.external_call_id) {
    result.display_external_call_id = maskUuid(result.external_call_id as string);
  }
  if (result.external_agent_id) {
    result.display_external_agent_id = maskUuid(result.external_agent_id as string);
  }
  
  return result as T;
}

/**
 * Filter response based on user role
 */
export async function filterResponseByRole<T extends Record<string, unknown>>(
  data: T | T[],
  userRole: UserRole,
  ownerId?: string,
  requesterId?: string
): Promise<T | T[] | Partial<T> | Partial<T>[]> {
  if (Array.isArray(data)) {
    if (userRole === "client") {
      return await Promise.all(
        data.map(item => filterForClient(item, ownerId, requesterId))
      );
    }
    return await Promise.all(
      data.map(item => filterForInternal(item))
    );
  }
  
  if (userRole === "client") {
    return await filterForClient(data, ownerId, requesterId);
  }
  
  return await filterForInternal(data);
}

/**
 * Create a safe call response for clients
 */
export async function createClientCallResponse(call: Record<string, unknown>): Promise<Record<string, unknown>> {
  return {
    id: call.id,
    status: call.status,
    connected: call.connected,
    duration_seconds: call.duration_seconds,
    started_at: call.started_at,
    ended_at: call.ended_at,
    created_at: call.created_at,
    sentiment: call.sentiment,
    // Encrypted fields
    transcript: call.transcript ? await encryptData(call.transcript as string) : null,
    summary: call.summary ? await encryptData(call.summary as string) : null,
    // Proxied recording
    recording_url: call.id ? `proxy:recording:${call.id}` : null,
    // Agent info (safe subset)
    agent: call.agent ? {
      name: (call.agent as Record<string, unknown>).name || "Agent",
    } : null,
    // Sanitized metadata - only safe fields
    metadata: call.metadata ? {
      source: (call.metadata as Record<string, unknown>).source,
      is_retry: (call.metadata as Record<string, unknown>).is_retry,
      campaign_id: (call.metadata as Record<string, unknown>).campaign_id,
    } : null,
    // NEVER include: external_call_id, agent_config, api_latency, token_usage, etc.
  };
}

/**
 * Create a safe agent response for clients
 */
export async function createClientAgentResponse(agent: Record<string, unknown>): Promise<Record<string, unknown>> {
  return {
    id: agent.id,
    agent_name: agent.agent_name,
    status: agent.status,
    created_at: agent.created_at,
    updated_at: agent.updated_at,
    // NEVER include: external_agent_id, system_prompt, agent_config, llm settings
  };
}

/**
 * Create a safe lead response for clients
 */
export function createClientLeadResponse(lead: Record<string, unknown>, isOwner: boolean): Record<string, unknown> {
  if (!isOwner) {
    // Non-owners should never see lead data
    return {
      id: lead.id,
      stage: lead.stage,
      // Everything else hidden
    };
  }
  
  return {
    id: lead.id,
    name: lead.name,
    phone_number: maskPhone(lead.phone_number as string),
    email: lead.email ? maskEmail(lead.email as string) : null,
    stage: lead.stage,
    interest_level: lead.interest_level,
    call_status: lead.call_status,
    call_summary: lead.call_summary ? "[Encrypted]" : null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    // NEVER include: custom_fields raw data, internal notes
  };
}

/**
 * Create a safe campaign response for clients
 */
export function createClientCampaignResponse(campaign: Record<string, unknown>, isOwner: boolean): Record<string, unknown> {
  if (!isOwner) {
    return { error: "Forbidden" };
  }
  
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    total_leads: campaign.total_leads,
    contacted_leads: campaign.contacted_leads,
    interested_leads: campaign.interested_leads,
    not_interested_leads: campaign.not_interested_leads,
    partially_interested_leads: campaign.partially_interested_leads,
    concurrency_level: campaign.concurrency_level,
    created_at: campaign.created_at,
    updated_at: campaign.updated_at,
    // NEVER include: google_sheet_id, api_endpoint, api_key, api_headers
  };
}

/**
 * Sanitize AI analysis response - remove all internal details
 */
export function sanitizeAIResponse(response: Record<string, unknown>): Record<string, unknown> {
  return {
    response: response.response,
    // NEVER include: model, tokens, latency, provider details
  };
}

/**
 * Validate that a response contains no forbidden fields (for testing)
 */
export function validateClientResponse(data: unknown): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  function check(obj: unknown, path: string = "") {
    if (typeof obj !== "object" || obj === null) return;
    
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (CLIENT_FORBIDDEN_FIELDS.includes(key)) {
        violations.push(fullPath);
      }
      
      if (typeof value === "object" && value !== null) {
        check(value, fullPath);
      }
    }
  }
  
  check(data);
  
  return {
    valid: violations.length === 0,
    violations,
  };
}
