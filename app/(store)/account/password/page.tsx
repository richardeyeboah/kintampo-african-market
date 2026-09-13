import { redirect } from 'next/navigation'
import { createClientOptional } from '@/lib/supabase/server'
import { ChangePasswordForm } from './ChangePasswordForm'

export const dynamic = 'force-dynamic'

export default async function PasswordPage() {
  const supabase = await createClientOptional()
  if (!supabase) redirect('/login?next=/account/password&error=configuration')
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account/password')

  return (
    <>
      <p className="section-eyebrow">Security</p>
      <h1 className="section-title mt-2">Change password</h1>
      <p className="section-subtitle mt-2">Use a strong, unique password for your account.</p>
      <div className="premium-card mt-8 max-w-lg p-6 sm:p-8">
        <ChangePasswordForm />
      </div>
    </>
  )
}
