import { sql } from './client';
import type { InviteCode } from './client';

// Validate an invite code (single-use)
export async function validateInviteCode(code: string): Promise<boolean> {
  const result = await sql`
    SELECT * FROM invite_codes
    WHERE code = ${code}
      AND is_used = FALSE
  `;
  return result.length > 0;
}

// Get invite code details
export async function getInviteCode(code: string): Promise<InviteCode | null> {
  const result = await sql`
    SELECT * FROM invite_codes
    WHERE code = ${code}
  `;
  return result[0] as InviteCode | null;
}

// Mark invite code as used (single-use only)
export async function markInviteCodeUsed(code: string, userId: string): Promise<void> {
  await sql`
    UPDATE invite_codes
    SET 
      is_used = TRUE,
      used_by = ${userId},
      used_at = NOW()
    WHERE code = ${code}
      AND is_used = FALSE
  `;
}
