import { z } from 'zod'

// Schemat walidacji dla dodawania/edycji tutora
export const tutorSchema = z.object({
  first_name: z
    .string()
    .min(1, 'Imię jest wymagane')
    .min(2, 'Imię musi mieć co najmniej 2 znaki')
    .max(100, 'Imię jest za długie'),
  last_name: z
    .string()
    .min(1, 'Nazwisko jest wymagane')
    .min(2, 'Nazwisko musi mieć co najmniej 2 znaki')
    .max(100, 'Nazwisko jest za długie'),
  email: z
    .string()
    .email('Nieprawidłowy format email')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Numer telefonu jest za długi')
    .optional()
    .or(z.literal('')),
  rate: z
    .number()
    .positive('Stawka musi być większa od 0')
    .optional()
    .or(z.nan()),
  bio: z
    .string()
    .max(2000, 'Bio jest za długie')
    .optional(),
  active: z
    .boolean()
    .optional()
    .default(true),
})

export type TutorFormData = z.infer<typeof tutorSchema>

