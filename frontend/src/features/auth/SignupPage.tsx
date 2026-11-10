import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/PasswordInput'
import { Input } from '@/components/ui/input'
import { AuthShell } from './AuthShell'
import { useSignup } from './api'
import { signupSchema, type SignupForm } from './schemas'

export function SignupPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { organizationName: '', name: '', email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signup.mutateAsync(values)
      navigate('/app/properties')
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  return (
    <AuthShell
      title="Crie sua conta na Imobly"
      description="Comece a gestão da sua imobiliária agora."
      footer={<>Já tem uma conta? <Link className="font-medium text-brand-solid hover:underline dark:text-brand" to="/login">Fazer login</Link></>}
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <FormError error={signup.error} />
        <Field label="Nome da imobiliária" error={errors.organizationName?.message}>
          {(p) => <Input autoComplete="organization" {...p} {...form.register('organizationName')} />}
        </Field>
        <Field label="Seu nome" error={errors.name?.message}>
          {(p) => <Input autoComplete="name" {...p} {...form.register('name')} />}
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          {(p) => <Input type="email" autoComplete="email" {...p} {...form.register('email')} />}
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          {(p) => <PasswordInput autoComplete="new-password" {...p} {...form.register('password')} />}
        </Field>
        <Button type="submit" variant="brand" size="lg" className="mt-1" disabled={isSubmitting}>{isSubmitting ? 'Criando conta…' : 'Criar conta'}</Button>
      </form>
    </AuthShell>
  )
}
