import { z } from 'zod'

// Schemat walidacji dla logowania
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane')
    .min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Schemat walidacji dla rejestracji
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane')
    .min(6, 'Hasło musi mieć co najmniej 6 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę'),
  confirmPassword: z
    .string()
    .min(1, 'Potwierdzenie hasła jest wymagane'),
  fullName: z
    .string()
    .min(1, 'Imię i nazwisko jest wymagane')
    .min(3, 'Imię i nazwisko musi mieć co najmniej 3 znaki'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// Schemat walidacji dla resetowania hasła
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

