import { createClient } from "@/lib/supabase/server"
import { getProfile, getStudents } from "@/lib/supabase/queries"
import { StudentsDataTable } from "@/components/students-data-table"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Profile } from "@/types"

// Wymuś dynamiczne renderowanie - zawsze pobieraj świeże dane
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Strona uczniów przypisanych do tutora
 * Wyświetla listę uczniów w tabeli z możliwością filtrowania
 */
export default async function TutorStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć swoich uczniów.</p>
      </div>
    )
  }

  const { data: profileData } = await getProfile(supabase, user.id)
  const profile = profileData as Profile | null
  
  if (!profile || profile.role !== 'tutor') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ta strona jest dostępna tylko dla korepetytorów.</p>
      </div>
    )
  }

  // Pobierz dane korepetytora
  const { data: tutorData } = await supabase
    .from('tutors')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  // Jeśli nie ma danych tutora, wyświetl pustą stronę z tabelą
  const tutorName = tutorData ? `${tutorData.first_name} ${tutorData.last_name}` : 'Korepetytor'

  // Pobierz przedmioty tutora (tylko te które ma w profilu)
  let tutorSubjects: Array<{
    id: string
    name: string
    level: 'basic' | 'intermediate' | 'advanced'
  }> = []

  if (tutorData) {
    const { data: subjectsData } = await supabase
      .from('tutor_subjects')
      .select(`
        subject_id,
        level,
        subjects (
          id,
          name
        )
      `)
      .eq('tutor_id', tutorData.id)

    if (subjectsData) {
      tutorSubjects = (subjectsData as any[])
        .filter((item: any) => item.subjects && !Array.isArray(item.subjects))
        .map((item: any) => ({
          id: item.subjects.id,
          name: item.subjects.name,
          level: item.level
        }))
    }
  }

  // Pobierz wszystkich uczniów (dla dialogu przypisywania istniejącego ucznia)
  const { data: allStudentsData } = await getStudents(supabase)
  const allStudents = allStudentsData || []

  // Pobierz zapisy uczniów przypisanych do tego tutora (tylko jeśli tutorData istnieje)
  const { data: enrollmentsData } = tutorData ? await supabase
    .from('enrollments')
    .select(`
      *,
      students (*),
      subjects (*)
    `)
    .eq('tutor_id', tutorData.id)
    .order('created_at', { ascending: false }) : { data: null }

  // Przekształć dane na format dla tabeli
  const studentsData = enrollmentsData?.map(enrollment => {
    const student = enrollment.students
    const subject = enrollment.subjects
    const status = enrollment.status === 'active' ? 'Aktywny' : 
                  enrollment.status === 'completed' ? 'Zakończony' : 
                  enrollment.status === 'on_hold' ? 'Wstrzymany' : 'Anulowany'
    
    // Znajdź poziom dla tego przedmiotu
    const subjectLevel = tutorSubjects.find(ts => ts.id === subject?.id)?.level || 'basic'
    const poziomLabel = subjectLevel === 'basic' ? 'Podstawowy' : 
                       subjectLevel === 'intermediate' ? 'Średni' : 'Zaawansowany'
    
    return {
      id: enrollment.id,
      imieNazwisko: `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || '—',
      przedmiot: subject?.name || '—',
      poziom: poziomLabel,
      poziomRaw: subjectLevel, // Do kolorowania
      status: status,
      dataRozpoczecia: enrollment.start_date || '',
    }
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Moi Uczniowie
          </h1>
          <p className="text-muted-foreground">
            Lista uczniów przypisanych do Twoich przedmiotów
          </p>
        </div>
        {tutorData ? (
          <AddStudentDialog 
            tutorId={tutorData.id}
            tutorSubjects={tutorSubjects}
            existingStudents={allStudents}
          />
        ) : (
          <div className="text-sm text-muted-foreground">
            Aby dodawać uczniów, najpierw uzupełnij swój profil
          </div>
        )}
      </div>

      {/* Statystyki */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Wszyscy uczniowie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsData.length}</div>
            <p className="text-xs text-muted-foreground">
              Przypisani uczniowie
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktywni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentsData.filter(s => s.status === 'Aktywny').length}
            </div>
            <p className="text-xs text-muted-foreground">
              W trakcie nauki
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Zakończeni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentsData.filter(s => s.status === 'Zakończony').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ukończone kursy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela uczniów */}
      <Card>
        <CardHeader>
          <CardTitle>Lista uczniów</CardTitle>
          <CardDescription>
            {studentsData.length > 0 
              ? `Znaleziono ${studentsData.length} uczniów przypisanych do Twoich przedmiotów`
              : "Brak przypisanych uczniów"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsDataTable data={studentsData} />
        </CardContent>
      </Card>
    </div>
  )
}
