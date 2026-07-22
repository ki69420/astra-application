import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url: string) {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/, "");
}

export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !key) {
    throw new Error(
      "Supabase storage environment variables are not configured",
    );
  }

  const url = normalizeSupabaseUrl(rawUrl);

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
