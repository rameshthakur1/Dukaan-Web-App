import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://udmljzocmslctphmnpfd.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DcA9X5tc4yvyzdL8aiELJw_Vyno_wbz';

export function toValidUuid(str?: string | null): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(str)) return str;

  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ code, 0x01000193);
    hash2 = Math.imul(hash2 ^ code, 0x811c9dc5);
  }
  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (Math.imul(hash1, hash2) >>> 0).toString(16).padStart(8, '0');
  const hex4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  const hexCombined = (hex1 + hex2 + hex3 + hex4).slice(0, 32);

  return `${hexCombined.slice(0, 8)}-${hexCombined.slice(8, 12)}-4${hexCombined.slice(13, 16)}-a${hexCombined.slice(17, 20)}-${hexCombined.slice(20, 32)}`;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});


