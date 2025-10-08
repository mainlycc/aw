import { createClient } from "@/lib/supabase/server"
import { PageTitleSetter } from "@/components/page-title-setter"
import { StudentsAdminDataTable } from "@/components/students-admin-data-table"
import { AddStudentAdminDialog } from "@/components/add-student-admin-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Strona zarządzania uczniami
 * Wyświetla tabelę ze wszystkimi uczniami i ich danymi
 */
export default async function UcznioPage() {
  const supabase = await createClient()

  // Pobierz wszystkich uczniów z ich enrollments i poziomami
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      active,
      created_at,
      notes,
      enrollments (
        id,
        start_date,
        tutor_id,
        subject_id,
        subjects (
          name
        )
      )
    `)
    .order('last_name', { ascending: true })

  if (studentsError) {
    console.error('Błąd podczas pobierania uczniów:', studentsError)
  }

  // Przekształć dane dla tabeli
  const studentsData = await Promise.all(
    (students as any)?.map(async (student: any) => {
      // Zbierz unikalne nazwy przedmiotów
      const przedmiotySet = new Set<string>()
      student.enrollments?.forEach((enrollment: any) => {
        if (enrollment.subjects?.name) {
          przedmiotySet.add(enrollment.subjects.name)
        }
      })
      const przedmioty = Array.from(przedmiotySet).join(", ")

      // Użyj pierwszego enrollment jako ID (jeśli istnieje)
      const firstEnrollment = student.enrollments?.[0]
      const firstEnrollmentId = firstEnrollment?.id || null

      // Pobierz poziom z tutor_subjects jeśli istnieje enrollment
      let poziom = '—'
      let poziomRaw = 'basic'
      
      if (firstEnrollment && firstEnrollment.tutor_id && firstEnrollment.subject_id) {
        const { data: tutorSubject } = await supabase
          .from('tutor_subjects')
          .select('level')
          .eq('tutor_id', firstEnrollment.tutor_id)
          .eq('subject_id', firstEnrollment.subject_id)
          .single()

        if (tutorSubject && (tutorSubject as any).level) {
          const levelValue = (tutorSubject as any).level
          poziomRaw = levelValue
          
          switch(levelValue) {
            case 'basic': poziom = 'Podstawowy'; break
            case 'intermediate': poziom = 'Średni'; break
            case 'advanced': poziom = 'Zaawansowany'; break
            case 'expert': poziom = 'Ekspercki'; break
            default: poziom = levelValue
          }
        }
      }

      return {
        studentId: student.id,
        enrollmentId: firstEnrollmentId,
        imieNazwisko: `${student.first_name} ${student.last_name}`,
        firstName: student.first_name,
        lastName: student.last_name,
        active: student.active,
        poziom: poziom,
        poziomRaw: poziomRaw,
        przedmioty: przedmioty || '—',
        dataUtworzenia: student.created_at,
        notes: student.notes,
      }
    }) || []
  )

  const activeStudentsCount = studentsData.filter((s: any) => s.active).length

  return (
    <div className="space-y-6">
      <PageTitleSetter title="Uczniowie" />
      
      <div className="flex items-center justify-end">
        <AddStudentAdminDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wszyscy Uczniowie</CardTitle>
            <CardDescription>Łączna liczba</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentsData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktywni</CardTitle>
            <CardDescription>Uczniowie uczęszczający</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeStudentsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nieaktywni</CardTitle>
            <CardDescription>Uczniowie nieaktywni</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentsData.length - activeStudentsCount}</div>
          </CardContent>
        </Card>
      </div>

      <StudentsAdminDataTable data={studentsData} />
    </div>
  )
}

