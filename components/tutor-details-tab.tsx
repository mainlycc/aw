'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditTutorAdminDialog } from "@/components/edit-tutor-admin-dialog"

interface Subject {
  id: string
  name: string
}

interface TutorSubject {
  subject_id: string
  level: string
  subjects: {
    id: string
    name: string
  }
}

interface Tutor {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  rate: number | null
  bio: string | null
  active: boolean
  tutor_subjects: TutorSubject[]
}

interface TutorDetailsTabProps {
  tutor: Tutor
  allSubjects: Subject[]
}

export function TutorDetailsTab({ tutor, allSubjects }: TutorDetailsTabProps) {

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dane osobowe</CardTitle>
            <CardDescription>Informacje o korepetytorze</CardDescription>
          </div>
          <EditTutorAdminDialog tutor={tutor} allSubjects={allSubjects} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Podstawowe dane */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Imię</label>
            <p className="text-sm">{tutor.first_name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nazwisko</label>
            <p className="text-sm">{tutor.last_name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm">{tutor.email || '—'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefon</label>
            <p className="text-sm">{tutor.phone || '—'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Stawka (zł/h)</label>
            <p className="text-sm">{tutor.rate ? `${tutor.rate} zł/h` : '—'}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Badge variant={tutor.active ? "default" : "secondary"}>
              {tutor.active ? 'Aktywny' : 'Nieaktywny'}
            </Badge>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Opis / Bio</label>
          <p className="text-sm text-muted-foreground">
            {tutor.bio || 'Brak opisu'}
          </p>
        </div>

        {/* Przedmioty z poziomami */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Przedmioty i poziomy nauczania</label>
          <div className="flex flex-wrap gap-2">
            {tutor.tutor_subjects.length > 0 ? (
              tutor.tutor_subjects.map((ts) => {
                const levelLabels: Record<string, string> = {
                  basic: 'Podstawowy',
                  intermediate: 'Średniozaawansowany',
                  advanced: 'Zaawansowany'
                }
                const levelColors: Record<string, string> = {
                  basic: 'bg-green-100 text-green-800 border-green-300',
                  intermediate: 'bg-blue-100 text-blue-800 border-blue-300',
                  advanced: 'bg-orange-100 text-orange-800 border-orange-300'
                }
                
                return (
                  <div key={ts.subject_id} className="flex items-center gap-1">
                    <Badge variant="outline">
                      {ts.subjects.name}
                    </Badge>
                    <Badge className={levelColors[ts.level] || levelColors.basic}>
                      {levelLabels[ts.level] || ts.level}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">Brak przypisanych przedmiotów</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

