import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class OperatorAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'OperatorAuthError';
    this.status = status;
  }
}

export async function requireOperator(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new OperatorAuthError('Authentication required', 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new OperatorAuthError('Server authorization is not configured', 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(match[1]);
  if (userError || !userData.user) {
    throw new OperatorAuthError('Invalid or expired session', 401);
  }

  const { data: operator, error: operatorError } = await admin
    .from('studio_operators')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (operatorError) {
    console.error('Operator lookup failed:', operatorError.message);
    throw new OperatorAuthError('Authorization check failed', 500);
  }
  if (!operator) throw new OperatorAuthError('Studio operator access required', 403);

  return { user: userData.user, admin };
}

export function operatorErrorResponse(err: unknown, headers: Record<string, string>) {
  if (!(err instanceof OperatorAuthError)) return null;

  return new Response(JSON.stringify({ error: err.message }), {
    status: err.status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
