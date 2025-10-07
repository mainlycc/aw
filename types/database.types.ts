// Typy wygenerowane na podstawie schematu bazy danych Supabase
// Aby zaktualizować te typy, użyj komendy:
// supabase gen types typescript --project-id your_project_id > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enumy z bazy danych
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'on_hold'
export type UserRole = 'admin' | 'tutor'
export type Kinship = 'guardian' | 'mother' | 'father' | 'grandparent' | 'other'
export type TeachingLevel = 'basic' | 'intermediate' | 'advanced' | 'expert'

export interface Database {
  public: {
    Tables: {
      // Tabela enrollments - Zapisy uczniów na przedmioty
      enrollments: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          tutor_id: string | null
          rate: number | null
          status: EnrollmentStatus
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          tutor_id?: string | null
          rate?: number | null
          status?: EnrollmentStatus
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          tutor_id?: string | null
          rate?: number | null
          status?: EnrollmentStatus
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
      }
      
      // Tabela parents - Rodzice uczniów
      parents: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          notes: string | null
          gdpr_accept_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          gdpr_accept_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          gdpr_accept_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Tabela profiles - Profile użytkowników (z rolami)
      profiles: {
        Row: {
          id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          created_at?: string
        }
      }
      
      // Tabela student_parents - Relacje uczniów z rodzicami
      student_parents: {
        Row: {
          student_id: string
          parent_id: string
          relation: Kinship
          is_primary: boolean
          created_at: string
        }
        Insert: {
          student_id: string
          parent_id: string
          relation?: Kinship
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          student_id?: string
          parent_id?: string
          relation?: Kinship
          is_primary?: boolean
          created_at?: string
        }
      }
      
      // Tabela students - Uczniowie
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          active: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          active?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Tabela subjects - Przedmioty
      subjects: {
        Row: {
          id: string
          name: string
          active: boolean
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          color?: string | null
          created_at?: string
        }
      }
      
      // Tabela tutor_subjects - Przedmioty prowadzone przez tutorów
      tutor_subjects: {
        Row: {
          tutor_id: string
          subject_id: string
          level: TeachingLevel
          created_at: string
        }
        Insert: {
          tutor_id: string
          subject_id: string
          level?: TeachingLevel
          created_at?: string
        }
        Update: {
          tutor_id?: string
          subject_id?: string
          level?: TeachingLevel
          created_at?: string
        }
      }
      
      // Tabela tutors - Tutorzy (korepetytorzy)
      tutors: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          rate: number | null
          bio: string | null
          active: boolean
          profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          rate?: number | null
          bio?: string | null
          active?: boolean
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          rate?: number | null
          bio?: string | null
          active?: boolean
          profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      enrollment_status: EnrollmentStatus
      user_role: UserRole
      kinship: Kinship
      teaching_level: TeachingLevel
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
