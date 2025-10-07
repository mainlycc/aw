import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"
import { TutorInfoCard } from "@/components/tutor-info-card"
import type { Profile } from "@/types"

// Wymuś dynamiczne renderowanie - zawsze pobieraj świeże dane
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Strona profilu tutora
 * Wyświetla dane korepetytora i pozwala na ich edycję
 */
export default async function TutorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć swój profil.</p>
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

  // Jeśli nie ma danych tutora, stwórz pusty obiekt
  const emptyTutorData = {
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rate: null,
    bio: '',
    active: true,
    profile_id: profile.id,
    created_at: '',
    updated_at: ''
  }

  const displayTutorData = tutorData || emptyTutorData

  // Pobierz przedmioty korepetytora (tylko jeśli tutorData istnieje)
  let tutorSubjects: Array<{
    id: string
    name: string
    color?: string
    level: 'basic' | 'intermediate' | 'advanced'
  }> = []

  if (tutorData) {
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('tutor_subjects')
      .select(`
        subject_id,
        level,
        subjects (
          id,
          name,
          color
        )
      `)
      .eq('tutor_id', tutorData.id)

    console.log('Pobrane przedmioty tutora:', { subjectsData, subjectsError })

    if (subjectsData && !subjectsError) {
      tutorSubjects = (subjectsData as any[])
        .filter((item: any) => item.subjects && !Array.isArray(item.subjects))
        .map((item: any) => ({
          id: item.subjects.id,
          name: item.subjects.name,
          color: item.subjects.color || undefined,
          level: item.level
        }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Mój Profil
        </h1>
        <p className="text-muted-foreground">
          Zarządzaj swoimi danymi kontaktowymi i informacjami o sobie
        </p>
      </div>

      {/* Wyświetl dane korepetytora */}
      <TutorInfoCard 
        tutor={displayTutorData} 
        tutorSubjects={tutorSubjects}
      />
    </div>
  )
}
