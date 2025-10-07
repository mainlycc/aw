import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getActiveStudents, 
  getActiveTutors, 
  getActiveEnrollments,
  getActiveSubjects 
} from "@/lib/supabase/queries"

/**
 * Dashboard dla admina
 * Główna strona panelu administratora z statystykami
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Pobierz statystyki
  const [studentsResult, tutorsResult, enrollmentsResult, subjectsResult] = await Promise.all([
    getActiveStudents(supabase),
    getActiveTutors(supabase),
    getActiveEnrollments(supabase),
    getActiveSubjects(supabase),
  ])

  const studentsCount = studentsResult.data?.length || 0
  const tutorsCount = tutorsResult.data?.length || 0
  const enrollmentsCount = enrollmentsResult.data?.length || 0
  const subjectsCount = subjectsResult.data?.length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Admina
        </h1>
        <p className="text-muted-foreground">
          Witaj w panelu administratora Akademii Wiedzy! 👋
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Aktywni Uczniowie</CardTitle>
            <CardDescription>Liczba uczniów</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentsCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Uczniowie aktywnie uczęszczający
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktywni Tutorzy</CardTitle>
            <CardDescription>Liczba korepetytorów</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tutorsCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Korepetytorzy prowadzący zajęcia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktywne Zapisy</CardTitle>
            <CardDescription>Bieżące kursy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{enrollmentsCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Zapisy w tym semestrze
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Przedmioty</CardTitle>
            <CardDescription>Dostępne kursy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subjectsCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Aktywne przedmioty
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Szybki Start</CardTitle>
            <CardDescription>Najczęstsze akcje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Dodaj nowego ucznia
            </p>
            <p className="text-sm text-muted-foreground">
              • Zarejestruj korepetytora
            </p>
            <p className="text-sm text-muted-foreground">
              • Utwórz nowy zapis na kurs
            </p>
            <p className="text-sm text-muted-foreground">
              • Zarządzaj przedmiotami
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ostatnie Aktywności</CardTitle>
            <CardDescription>Najnowsze zdarzenia w systemie</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Wkrótce dostępne - historia zmian i aktywności
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

