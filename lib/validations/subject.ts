import { z } from 'zod'

// Schemat walidacji dla dodawania/edycji przedmiotu
export const subjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Nazwa przedmiotu jest wymagana')
    .min(2, 'Nazwa przedmiotu musi mieć co najmniej 2 znaki')
    .max(100, 'Nazwa przedmiotu jest za długa'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Nieprawidłowy format koloru (użyj formatu #RRGGBB)')
    .optional()
    .or(z.literal('')),
  active: z
    .boolean()
    .optional()
    .default(true),
})

export type SubjectFormData = z.infer<typeof subjectSchema>

