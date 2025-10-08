import { createClient } from "@/lib/supabase/server"
import { PageTitleSetter } from "@/components/page-title-setter"
import { TutorsDataTable } from "@/components/tutors-data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Strona zarządzania korepetytorami
 * Wyświetla tabelę ze wszystkimi korepetytorami i ich danymi
 */
export default async function KorepetytorzyPage() {
  const supabase = await createClient()

  // Pobierz wszystkich tutorów z przedmiotami
  const { data: tutors, error: tutorsError } = await supabase
    .from('tutors')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      rate,
      active,
      tutor_subjects (
        subjects (
          name
        )
      )
    `)
    .order('last_name', { ascending: true })

  if (tutorsError) {
    console.error('Błąd podczas pobierania korepetytorów:', tutorsError)
  }

  // Przekształć dane dla tabeli
  const tutorsData = (tutors as any)?.map((tutor: any) => {
    // Zbierz nazwy przedmiotów
    const przedmioty = tutor.tutor_subjects
      ?.map((ts: any) => ts.subjects?.name)
      .filter(Boolean)
      .join(", ") || ""

    return {
      id: tutor.id,
      imieNazwisko: `${tutor.first_name} ${tutor.last_name}`,
      email: tutor.email,
      phone: tutor.phone,
      rate: tutor.rate,
      active: tutor.active,
      przedmioty: przedmioty,
    }
  }) || []

  const activeTutorsCount = tutorsData.filter(t => t.active).length

  return (
    <div className="space-y-6">
      <PageTitleSetter title="Korepetytorzy" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wszyscy Korepetytorzy</CardTitle>
            <CardDescription>Łączna liczba</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tutorsData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktywni</CardTitle>
            <CardDescription>Korepetytorzy prowadzący zajęcia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTutorsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nieaktywni</CardTitle>
            <CardDescription>Korepetytorzy niezaangażowani</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tutorsData.length - activeTutorsCount}</div>
          </CardContent>
        </Card>
      </div>

      <TutorsDataTable data={tutorsData} />
    </div>
  )
}


