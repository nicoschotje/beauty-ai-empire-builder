// Shared helpers for Edge Functions.
// Imported via relative path: ../_shared/auth.ts
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

export function userClient(authHeader: string): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
}

export interface AuthedUser {
  id: string;
  email: string | null;
  role: 'owner' | 'companion' | 'client';
  companion_id: string | null;
}

export async function requireAuth(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) throw new HttpError(401, 'unauthorized');
  const sb = userClient(authHeader);
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) throw new HttpError(401, 'unauthorized');
  const admin = adminClient();
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role, companion_id')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileErr || !profile) throw new HttpError(401, 'unauthorized');
  return {
    id: userData.user.id,
    email: userData.user.email ?? null,
    role: profile.role,
    companion_id: profile.companion_id,
  };
}

export function requireRole(user: AuthedUser, role: 'owner' | 'companion' | 'client'): void {
  if (user.role !== role) throw new HttpError(403, 'forbidden');
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function clientIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('cf-connecting-ip')
      ?? null;
}

export function userAgent(req: Request): string | null {
  return req.headers.get('user-agent');
}

export async function audit(opts: {
  user: AuthedUser;
  action: string;
  target_table: string;
  target_id: string | null;
  old_value?: unknown;
  new_value?: unknown;
  req: Request;
}): Promise<void> {
  const admin = adminClient();
  await admin.from('audit_log').insert({
    performed_by: opts.user.id,
    role: opts.user.role,
    action: opts.action,
    target_table: opts.target_table,
    target_id: opts.target_id,
    old_value: opts.old_value ?? null,
    new_value: opts.new_value ?? null,
    ip_address: clientIp(opts.req),
    user_agent: userAgent(opts.req),
  });
}

export async function handle(req: Request, fn: (req: Request) => Promise<Response>): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    return await fn(req);
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e.message, e.status);
    console.error(e);
    return errorResponse('internal_error', 500);
  }
}

// Redact known sensitive fields before logging
export function redact<T extends Record<string, unknown>>(input: T | null | undefined): Partial<T> | null {
  if (!input) return null;
  const banned = new Set([
    'phone', 'reference', 'proof_path', 'storage_path', 'date_of_birth',
    'consent_ip_address', 'ip_address',
  ]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    out[k] = banned.has(k) ? '[redacted]' : v;
  }
  return out as Partial<T>;
}
