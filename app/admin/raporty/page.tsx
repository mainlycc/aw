import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"
import { getAllBillingMonths } from "@/lib/supabase/billing-queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageTitleSetter } from "@/components/page-title-setter"
import type { Profile } from "@/types"

// Wymuś dynamiczne renderowanie - zawsze pobieraj świeże dane
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Strona raportów - widok rozliczeń wszystkich korepetytorów (tylko dla admina)
 */
export default async function AdminRaportyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć raporty.</p>
      </div>
    )
  }

  const { data: profileData } = await getProfile(supabase, user.id)
  const profile = profileData as Profile | null
  
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ta strona jest dostępna tylko dla administratorów.</p>
      </div>
    )
  }

  // Pobierz wszystkie rozliczenia
  const { data: billingData, error } = await getAllBillingMonths(supabase)

  if (error) {
    return (
      <div className="space-y-6">
        <PageTitleSetter title="Raporty" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporty rozliczeń</h1>
          <p className="text-muted-foreground">Rozliczenia wszystkich korepetytorów</p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">Błąd wczytywania danych: {error.message}</p>
        </div>
      </div>
    )
  }

  // Grupuj dane po korepetytorach i miesiącach
  const tutorMonths = (billingData || []).map((month: any) => {
    const totalHours = (month.billing_student_hours || []).reduce(
      (sum: number, sh: any) => sum + (sh.hours || 0),
      0
    )

    return {
      id: month.id,
      tutorName: month.tutors 
        ? `${month.tutors.first_name} ${month.tutors.last_name}`
        : 'Nieznany korepetytor',
      monthName: month.month_name,
      monthYear: month.month_year,
      totalHours,
      students: (month.billing_student_hours || []).map((sh: any) => ({
        id: sh.id,
        name: sh.students 
          ? `${sh.students.first_name} ${sh.students.last_name}`
          : 'Nieznany uczeń',
        hours: sh.hours
      }))
    }
  })

  // Grupuj po korepetytorach
  const tutorGroups = tutorMonths.reduce((acc: any, month: any) => {
    if (!acc[month.tutorName]) {
      acc[month.tutorName] = []
    }
    acc[month.tutorName].push(month)
    return acc
  }, {})

  // Oblicz statystyki
  const totalHoursAll = tutorMonths.reduce((sum: number, m: any) => sum + m.totalHours, 0)
  const totalTutors = Object.keys(tutorGroups).length
  const totalMonths = tutorMonths.length

  return (
    <div className="space-y-6">
      <PageTitleSetter title="Raporty" />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporty rozliczeń</h1>
        <p className="text-muted-foreground">
          Przegląd rozliczeń wszystkich korepetytorów
        </p>
      </div>

      {/* Statystyki globalne */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Suma godzin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursAll}h</div>
            <p className="text-xs text-muted-foreground">
              Wszystkie miesiące i korepetytorzy
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Korepetytorzy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTutors}</div>
            <p className="text-xs text-muted-foreground">
              Z rozliczeniami
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Miesiące
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonths}</div>
            <p className="text-xs text-muted-foreground">
              Łącznie
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista rozliczeń po korepetytorach */}
      {Object.keys(tutorGroups).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Brak rozliczeń do wyświetlenia
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Korepetytorzy muszą najpierw dodać swoje rozliczenia
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(tutorGroups).map(([tutorName, months]: [string, any]) => {
            const tutorTotalHours = months.reduce((sum: number, m: any) => sum + m.totalHours, 0)
            
            return (
              <Card key={tutorName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{tutorName}</CardTitle>
                      <CardDescription>
                        {months.length} {months.length === 1 ? 'miesiąc' : 'miesięcy'} • {tutorTotalHours}h łącznie
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{tutorTotalHours}h</div>
                      <div className="text-xs text-muted-foreground">Suma godzin</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {months.map((month: any) => (
                      <div key={month.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{month.monthName} {month.monthYear}</h3>
                            <p className="text-sm text-muted-foreground">
                              {month.students.length} {month.students.length === 1 ? 'uczeń' : 'uczniów'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{month.totalHours}h</div>
                            <div className="text-xs text-muted-foreground">Suma</div>
                          </div>
                        </div>

                        {month.students.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Uczeń</TableHead>
                                <TableHead className="text-right">Godziny</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {month.students.map((student: any) => (
                                <TableRow key={student.id}>
                                  <TableCell>{student.name}</TableCell>
                                  <TableCell className="text-right">{student.hours}h</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

