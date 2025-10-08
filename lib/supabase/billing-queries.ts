import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

type BillingMonthInsert = Database['public']['Tables']['billing_months']['Insert']
type BillingMonthUpdate = Database['public']['Tables']['billing_months']['Update']
type BillingStudentHoursInsert = Database['public']['Tables']['billing_student_hours']['Insert']

/**
 * Pobiera wszystkie miesiące rozliczeniowe dla danego korepetytora
 */
export async function getTutorBillingMonths(
  supabase: SupabaseClient<Database>,
  tutorId: string
) {
  const { data, error } = await supabase
    .from('billing_months')
    .select(`
      *,
      billing_student_hours (
        id,
        student_id,
        hours,
        students (
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('tutor_id', tutorId)
    .order('month_year', { ascending: false })
    .order('month_name', { ascending: false })

  return { data, error }
}

/**
 * Pobiera wszystkie miesiące rozliczeniowe wszystkich korepetytorów (dla admina)
 */
export async function getAllBillingMonths(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('billing_months')
    .select(`
      *,
      tutors (
        id,
        first_name,
        last_name
      ),
      billing_student_hours (
        id,
        student_id,
        hours,
        students (
          id,
          first_name,
          last_name
        )
      )
    `)
    .order('month_year', { ascending: false })
    .order('month_name', { ascending: false })

  return { data, error }
}

/**
 * Tworzy nowy miesiąc rozliczeniowy
 */
export async function createBillingMonth(
  supabase: SupabaseClient<Database>,
  month: BillingMonthInsert
) {
  const { data, error } = await supabase
    .from('billing_months')
    .insert(month)
    .select()
    .single()

  return { data, error }
}

/**
 * Aktualizuje miesiąc rozliczeniowy
 */
export async function updateBillingMonth(
  supabase: SupabaseClient<Database>,
  id: string,
  month: BillingMonthUpdate
) {
  const { data, error } = await supabase
    .from('billing_months')
    .update(month)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Usuwa miesiąc rozliczeniowy (i wszystkie powiązane godziny uczniów)
 */
export async function deleteBillingMonth(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase
    .from('billing_months')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * Dodaje lub aktualizuje godziny ucznia w miesiącu
 */
export async function upsertStudentHours(
  supabase: SupabaseClient<Database>,
  studentHours: BillingStudentHoursInsert
) {
  const { data, error } = await supabase
    .from('billing_student_hours')
    .upsert(studentHours)
    .select()
    .single()

  return { data, error }
}

/**
 * Usuwa godziny ucznia z miesiąca
 */
export async function deleteStudentHours(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase
    .from('billing_student_hours')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * Pobiera ID korepetytora dla zalogowanego użytkownika
 */
export async function getCurrentTutorId(supabase: SupabaseClient<Database>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Nie jesteś zalogowany') }

  const { data: tutor, error } = await supabase
    .from('tutors')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  return { data: tutor?.id || null, error }
}

