/**
 * Pomocnicze funkcje do zapytań do bazy danych Supabase
 * Używaj tych funkcji zamiast bezpośrednich zapytań dla spójności
 */

import type { Database } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

type TypedSupabaseClient = SupabaseClient<Database>

// ============================================
// STUDENTS - Uczniowie
// ============================================

/**
 * Pobierz wszystkich uczniów
 */
export async function getStudents(supabase: TypedSupabaseClient) {
  return await supabase
    .from('students')
    .select('*')
    .order('last_name', { ascending: true })
}

/**
 * Pobierz aktywnych uczniów
 */
export async function getActiveStudents(supabase: TypedSupabaseClient) {
  return await supabase
    .from('students')
    .select('*')
    .eq('active', true)
    .order('last_name', { ascending: true })
}

/**
 * Pobierz ucznia z rodzicami
 */
export async function getStudentWithParents(
  supabase: TypedSupabaseClient,
  studentId: string
) {
  return await supabase
    .from('students')
    .select(`
      *,
      student_parents (
        *,
        parents (*)
      )
    `)
    .eq('id', studentId)
    .single()
}

// ============================================
// TUTORS - Tutorzy
// ============================================

/**
 * Pobierz wszystkich tutorów
 */
export async function getTutors(supabase: TypedSupabaseClient) {
  return await supabase
    .from('tutors')
    .select('*')
    .order('last_name', { ascending: true })
}

/**
 * Pobierz aktywnych tutorów
 */
export async function getActiveTutors(supabase: TypedSupabaseClient) {
  return await supabase
    .from('tutors')
    .select('*')
    .eq('active', true)
    .order('last_name', { ascending: true })
}

/**
 * Pobierz tutora z przedmiotami
 */
export async function getTutorWithSubjects(
  supabase: TypedSupabaseClient,
  tutorId: string
) {
  return await supabase
    .from('tutors')
    .select(`
      *,
      tutor_subjects (
        *,
        subjects (*)
      )
    `)
    .eq('id', tutorId)
    .single()
}

// ============================================
// SUBJECTS - Przedmioty
// ============================================

/**
 * Pobierz wszystkie przedmioty
 */
export async function getSubjects(supabase: TypedSupabaseClient) {
  return await supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true })
}

/**
 * Pobierz aktywne przedmioty
 */
export async function getActiveSubjects(supabase: TypedSupabaseClient) {
  return await supabase
    .from('subjects')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })
}

// ============================================
// ENROLLMENTS - Zapisy
// ============================================

/**
 * Pobierz wszystkie zapisy
 */
export async function getEnrollments(supabase: TypedSupabaseClient) {
  return await supabase
    .from('enrollments')
    .select(`
      *,
      students (*),
      subjects (*),
      tutors (*)
    `)
    .order('created_at', { ascending: false })
}

/**
 * Pobierz aktywne zapisy
 */
export async function getActiveEnrollments(supabase: TypedSupabaseClient) {
  return await supabase
    .from('enrollments')
    .select(`
      *,
      students (*),
      subjects (*),
      tutors (*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
}

/**
 * Pobierz zapisy dla konkretnego ucznia
 */
export async function getEnrollmentsByStudent(
  supabase: TypedSupabaseClient,
  studentId: string
) {
  return await supabase
    .from('enrollments')
    .select(`
      *,
      subjects (*),
      tutors (*)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
}

/**
 * Pobierz zapisy dla konkretnego tutora
 */
export async function getEnrollmentsByTutor(
  supabase: TypedSupabaseClient,
  tutorId: string
) {
  return await supabase
    .from('enrollments')
    .select(`
      *,
      students (*),
      subjects (*)
    `)
    .eq('tutor_id', tutorId)
    .order('created_at', { ascending: false })
}

// ============================================
// PARENTS - Rodzice
// ============================================

/**
 * Pobierz wszystkich rodziców
 */
export async function getParents(supabase: TypedSupabaseClient) {
  return await supabase
    .from('parents')
    .select('*')
    .order('last_name', { ascending: true })
}

/**
 * Pobierz rodziców ucznia
 */
export async function getParentsByStudent(
  supabase: TypedSupabaseClient,
  studentId: string
) {
  return await supabase
    .from('student_parents')
    .select(`
      *,
      parents (*)
    `)
    .eq('student_id', studentId)
}

// ============================================
// PROFILES - Profile użytkowników
// ============================================

/**
 * Pobierz profil użytkownika po ID
 */
export async function getProfile(
  supabase: TypedSupabaseClient,
  userId: string
) {
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

/**
 * Utwórz profil użytkownika
 */
export async function createProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  role: 'admin' | 'tutor'
) {
  return await supabase
    .from('profiles')
    .insert({ id: userId, role })
    .select()
    .single()
}

