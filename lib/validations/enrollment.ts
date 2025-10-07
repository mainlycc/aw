import { z } from 'zod'

// Schemat walidacji dla dodawania/edycji zapisu
export const enrollmentSchema = z.object({
  student_id: z
    .string()
    .uuid('Nieprawidłowe ID ucznia'),
  subject_id: z
    .string()
    .uuid('Nieprawidłowe ID przedmiotu'),
  tutor_id: z
    .string()
    .uuid('Nieprawidłowe ID tutora')
    .optional()
    .or(z.literal('')),
  rate: z
    .number()
    .positive('Stawka musi być większa od 0')
    .optional()
    .or(z.nan()),
  start_date: z
    .string()
    .min(1, 'Data rozpoczęcia jest wymagana'),
  end_date: z
    .string()
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['active', 'completed', 'cancelled', 'on_hold'])
    .optional()
    .default('active'),
})

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>

