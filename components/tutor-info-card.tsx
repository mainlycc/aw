"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditTutorProfileDialog } from "@/components/edit-tutor-profile-dialog"
import { useProfile } from "@/hooks/use-profile"

interface TutorSubjectWithLevel {
  id: string
  name: string
  color?: string
  level: 'basic' | 'intermediate' | 'advanced'
}

interface TutorData {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  rate?: number | null
  bio?: string
  active?: boolean
  profile_id?: string | null
  created_at?: string
  updated_at?: string
}

interface TutorInfoCardProps {
  tutor: TutorData
  tutorSubjects: TutorSubjectWithLevel[]
}

export function TutorInfoCard({ tutor, tutorSubjects }: TutorInfoCardProps) {
  const { profile } = useProfile()
  
  // Sprawdź czy to nowy profil (nie ma ID)
  const isNewProfile = !tutor.id
  
  // Sprawdź czy użytkownik może edytować (tylko właściciel profilu)
  const canEdit = profile && profile.role === 'tutor' && tutor.profile_id === profile.id

  return (
    <div className="space-y-4">
      {isNewProfile && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Uzupełnij swój profil
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Aby móc dodawać uczniów i zarządzać nimi, uzupełnij swoje dane kontaktowe
              </p>
            </div>
            {canEdit && (
              <EditTutorProfileDialog 
                tutor={tutor} 
                isNewProfile={isNewProfile}
                existingSubjects={tutorSubjects.map(s => ({
                  id: s.id,
                  name: s.name,
                  level: s.level
                }))}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Podstawowe informacje</CardTitle>
              {canEdit && !isNewProfile && (
                <EditTutorProfileDialog 
                  tutor={tutor} 
                  isNewProfile={false}
                  existingSubjects={tutorSubjects.map(s => ({
                    id: s.id,
                    name: s.name,
                    level: s.level
                  }))}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Imię</label>
                <p className="text-sm mt-1">{tutor.first_name || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nazwisko</label>
                <p className="text-sm mt-1">{tutor.last_name || "—"}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm mt-1">{tutor.email || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefon</label>
              <p className="text-sm mt-1">{tutor.phone || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={tutor.active ? "default" : "secondary"}>
                  {tutor.active ? "Aktywny" : "Nieaktywny"}
                </Badge>
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Przedmioty i poziomy nauczania</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tutorSubjects.length > 0 ? (
                  tutorSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={subject.color ? { borderColor: subject.color, color: subject.color } : undefined}
                      >
                        {subject.name}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{
                          backgroundColor: subject.level === 'advanced' ? '#fee2e2' : 
                                         subject.level === 'intermediate' ? '#fed7aa' : '#dcfce7',
                          color: subject.level === 'advanced' ? '#dc2626' : 
                                 subject.level === 'intermediate' ? '#ea580c' : '#16a34a'
                        }}
                      >
                        {subject.level === 'basic' ? 'Podstawowy' : 
                         subject.level === 'intermediate' ? 'Średni' : 'Zaawansowany'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Brak przypisanych przedmiotów</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>O mnie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {tutor.bio || "Brak opisu"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
