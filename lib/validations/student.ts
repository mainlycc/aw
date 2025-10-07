import { z } from 'zod'

// Schemat walidacji dla dodawania/edycji ucznia
export const studentSchema = z.object({
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
  notes: z
    .string()
    .max(1000, 'Notatki są za długie')
    .optional(),
  active: z
    .boolean()
    .optional()
    .default(true),
})

export type StudentFormData = z.infer<typeof studentSchema>

