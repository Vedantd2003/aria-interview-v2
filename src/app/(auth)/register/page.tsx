'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')
  const strength = Math.min(Math.floor(password.length / 3), 4)
  const strengthColors = ['#F43F5E', '#F97316', '#EAB308', '#10B981', '#10B981']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    })
    setLoading(false)
    if (error) {
      if (error.status === 429) {
        toast.error('Too many sign-up attempts. Please wait a minute and try again.')
      } else if (error.message?.includes('already registered')) {
        toast.error('An account with this email already exists. Try signing in.')
      } else {
        toast.error(error.message ?? 'Something went wrong. Please try again.')
      }
      return
    }
    // Auto-confirm is enabled — user is already signed in
    if (result.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.success('Account created! You can now sign in.')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold gradient-text">ARIA</Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Create your free account</p>
        </div>

        <div className="card-elevated p-8 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Alex Johnson" {...register('name')} />
              {errors.name && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ background: i <= strength ? strengthColors[strength] : 'var(--border-subtle)' }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs" style={{ color: 'var(--danger)' }}>{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}
              style={{ background: 'var(--accent-gradient)' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" className="hover:underline" style={{ color: 'var(--accent-violet)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
