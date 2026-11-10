import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/PasswordInput'
import { Input } from '@/components/ui/input'
import { AuthShell } from './AuthShell'
import { useLogin } from './api'
import { loginSchema, type LoginForm } from './schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      navigate('/app/properties')
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  return (
    <AuthShell
      title="Acesse sua conta"
      description="Entre para gerenciar seus imóveis e contratos."
      footer={<>Não tem conta? <Link className="font-medium text-brand-solid hover:underline dark:text-brand" to="/signup">Criar conta</Link></>}
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <FormError error={login.error} />
        <Field label="E-mail" error={errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" {...p} {...form.register('email')} />}
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          {(p) => <PasswordInput autoComplete="current-password" {...p} {...form.register('password')} />}
        </Field>
        <Button type="submit" variant="brand" size="lg" className="mt-1" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </AuthShell>
  )
}
