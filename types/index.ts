// Eksport wszystkich typów używanych w aplikacji

// Typy bazy danych Supabase
export type { Database, EnrollmentStatus, UserRole, Kinship, TeachingLevel } from './database.types'
import type { Database } from './database.types'

// Typy pomocnicze dla tabel
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert']
export type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update']

export type Parent = Database['public']['Tables']['parents']['Row']
export type ParentInsert = Database['public']['Tables']['parents']['Insert']
export type ParentUpdate = Database['public']['Tables']['parents']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type StudentParent = Database['public']['Tables']['student_parents']['Row']
export type StudentParentInsert = Database['public']['Tables']['student_parents']['Insert']
export type StudentParentUpdate = Database['public']['Tables']['student_parents']['Update']

export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type Subject = Database['public']['Tables']['subjects']['Row']
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert']
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update']

export type TutorSubject = Database['public']['Tables']['tutor_subjects']['Row']
export type TutorSubjectInsert = Database['public']['Tables']['tutor_subjects']['Insert']
export type TutorSubjectUpdate = Database['public']['Tables']['tutor_subjects']['Update']

export type Tutor = Database['public']['Tables']['tutors']['Row']
export type TutorInsert = Database['public']['Tables']['tutors']['Insert']
export type TutorUpdate = Database['public']['Tables']['tutors']['Update']

// Typy rozszerzone (z relacjami)
export interface StudentWithParents extends Student {
  student_parents?: (StudentParent & {
    parents: Parent
  })[]
}

export interface TutorWithSubjects extends Tutor {
  tutor_subjects?: (TutorSubject & {
    subjects: Subject
  })[]
}

export interface EnrollmentWithDetails extends Enrollment {
  students?: Student
  subjects?: Subject
  tutors?: Tutor
}

// Typy dla formularzy i UI
export interface StudentFormData {
  first_name: string
  last_name: string
  notes?: string
  active?: boolean
}

export interface TutorFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  rate?: number
  bio?: string
  active?: boolean
}

export interface ParentFormData {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  notes?: string
}

export interface SubjectFormData {
  name: string
  color?: string
  active?: boolean
}

export interface EnrollmentFormData {
  student_id: string
  subject_id: string
  tutor_id?: string
  rate?: number
  start_date: string
  end_date?: string
}
