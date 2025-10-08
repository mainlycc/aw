import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TutorDetailsTab } from "@/components/tutor-details-tab"
import { TutorStudentsTab } from "@/components/tutor-students-tab"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface TutorDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

async function TutorDetailsContent({ tutorId }: { tutorId: string }) {
  const supabase = await createClient()

  // Pobierz szczegóły korepetytora
  const { data: tutorData, error: tutorError } = await supabase
    .from('tutors')
    .select(`
      *,
      tutor_subjects (
        subject_id,
        level,
        subjects (
          id,
          name
        )
      )
    `)
    .eq('id', tutorId)
    .single()

  if (tutorError || !tutorData) {
    notFound()
  }

  const tutor = tutorData as any

  // Pobierz wszystkie przedmioty (dla edycji)
  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('active', true)
    .order('name')

  // Pobierz uczniów korepetytora
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      start_date,
      rate,
      level,
      students (
        id,
        first_name,
        last_name,
        active
      ),
      subjects (
        id,
        name
      )
    `)
    .eq('tutor_id', tutorId)
    .order('start_date', { ascending: false })

  // Pobierz wszystkich uczniów (dla przypisywania)
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, first_name, last_name, active')
    .eq('active', true)
    .order('last_name')

  return (
    <div className="space-y-6">
      {/* Header z przyciskiem powrotu */}
      <div className="flex items-center gap-4">
        <Link href="/admin/korepetytorzy">
          <Button variant="outline" size="sm">
            <IconArrowLeft className="size-4 mr-2" />
            Powrót
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {tutor.first_name} {tutor.last_name}
          </h1>
          <p className="text-muted-foreground">
            Szczegóły korepetytora
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dane" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dane">Dane korepetytora</TabsTrigger>
          <TabsTrigger value="uczniowie">Uczniowie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dane" className="mt-6">
          <TutorDetailsTab 
            tutor={tutor} 
            allSubjects={allSubjects || []}
          />
        </TabsContent>
        
        <TabsContent value="uczniowie" className="mt-6">
          <TutorStudentsTab 
            tutorId={tutorId}
            enrollments={enrollments || []}
            allStudents={allStudents || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TutorDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TutorDetailsPage({ params }: TutorDetailsPageProps) {
  const { id } = await params
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Suspense fallback={<TutorDetailsSkeleton />}>
        <TutorDetailsContent tutorId={id} />
      </Suspense>
    </div>
  )
}

