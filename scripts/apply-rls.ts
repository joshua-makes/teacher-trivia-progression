/**
 * Applies Row Level Security policies to Supabase tables.
 * Run once with: npx tsx scripts/apply-rls.ts
 */
import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })

const statements = [
  // ── Enable RLS ───────────────────────────────────────────────────────────
  `ALTER TABLE question_sets  ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE game_sessions  ENABLE ROW LEVEL SECURITY`,

  // ── question_sets ────────────────────────────────────────────────────────
  // Drop first so re-runs are idempotent
  `DROP POLICY IF EXISTS "owner_all"        ON question_sets`,
  `DROP POLICY IF EXISTS "public_shared_read" ON question_sets`,

  // Owners (authenticated users) can SELECT / INSERT / UPDATE / DELETE their own rows
  `CREATE POLICY "owner_all"
     ON question_sets
     FOR ALL
     TO authenticated
     USING      (user_id = auth.uid()::text)
     WITH CHECK (user_id = auth.uid()::text)`,

  // Anyone — even unauthenticated — can SELECT rows that have a share_token set
  `CREATE POLICY "public_shared_read"
     ON question_sets
     FOR SELECT
     TO anon, authenticated
     USING (share_token IS NOT NULL)`,

  // ── game_sessions ────────────────────────────────────────────────────────
  `DROP POLICY IF EXISTS "owner_all" ON game_sessions`,

  // Owners can SELECT / INSERT / UPDATE / DELETE their own sessions
  `CREATE POLICY "owner_all"
     ON game_sessions
     FOR ALL
     TO authenticated
     USING      (user_id = auth.uid()::text)
     WITH CHECK (user_id = auth.uid()::text)`,
]

async function main() {
  for (const stmt of statements) {
    process.stdout.write(`  → ${stmt.slice(0, 60).replace(/\s+/g, ' ')}…`)
    await sql.unsafe(stmt)
    console.log(' ✓')
  }
  await sql.end()
  console.log('\nRLS applied successfully.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
