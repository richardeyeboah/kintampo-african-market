/**
 * Mirrors .github/workflows/ci.yml for local runs.
 * Usage: node scripts/ci.mjs
 */
import { execSync } from 'node:child_process'

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'placeholder-service-role',
  STRIPE_SECRET_KEY: 'sk_test_placeholder',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
  STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
  NEXT_PUBLIC_SITE_URL: 'https://placeholder.example',
  ADMIN_PASSWORD: 'ci-placeholder',
  ADMIN_SESSION_SECRET: 'ci-placeholder-secret',
}

function run(cmd) {
  console.log(`\n> ${cmd}\n`)
  execSync(cmd, { stdio: 'inherit', env })
}

run('npm run lint')
run('npm run typecheck')
run('npm run build')
