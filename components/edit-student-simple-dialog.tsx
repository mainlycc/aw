"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface EditStudentSimpleDialogProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStudentSimpleDialog({ 
  studentId,
  open,
  onOpenChange 
}: EditStudentSimpleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isAddingEnrollment, setIsAddingEnrollment] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Formularz edycji ucznia
  const [studentData, setStudentData] = useState({
    first_name: "",
    last_name: "",
    notes: "",
    active: true,
  })

  // Dane do przypisania
  const [subjects, setSubjects] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [enrollmentData, setEnrollmentData] = useState({
    subject_id: "",
    tutor_id: "",
    level: "basic" as 'basic' | 'intermediate' | 'advanced' | 'expert',
    start_date: new Date().toISOString().split('T')[0],
  })

  // Załaduj dane ucznia przy otwarciu dialogu
  useEffect(() => {
    if (studentId && open) {
      fetchStudentData()
      fetchSubjectsAndTutors()
    }
  }, [studentId, open])

  const fetchStudentData = async () => {
    if (!studentId) return
    
    setIsFetching(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error) {
        console.error('Błąd podczas pobierania danych ucznia:', error)
        toast.error("Nie udało się pobrać danych ucznia")
        return
      }

      if (data) {
        setStudentData({
          first_name: (data as any).first_name,
          last_name: (data as any).last_name,
          notes: (data as any).notes || "",
          active: (data as any).active,
        })
      }
    } catch (error) {
      console.error('Błąd:', error)
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setIsFetching(false)
    }
  }

  const fetchSubjectsAndTutors = async () => {
    try {
      // Pobierz przedmioty
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (subjectsData) {
        setSubjects(subjectsData)
      }

      // Pobierz korepetytorów
      const { data: tutorsData } = await supabase
        .from('tutors')
        .select('*')
        .eq('active', true)
        .order('last_name', { ascending: true })

      if (tutorsData) {
        setTutors(tutorsData)
      }
    } catch (error) {
      console.error('Błąd podczas pobierania danych:', error)
    }
  }

  const getLevelLabel = (level: string) => {
    switch(level) {
      case 'basic': return 'Podstawowy'
      case 'intermediate': return 'Średni'
      case 'advanced': return 'Zaawansowany'
      case 'expert': return 'Ekspercki'
      default: return level
    }
  }

  const handleAddEnrollment = async () => {
    if (!studentId) return

    if (!enrollmentData.subject_id) {
      toast.error("Wybierz przedmiot")
      return
    }

    if (!enrollmentData.tutor_id) {
      toast.error("Wybierz korepetytora")
      return
    }

    setIsAddingEnrollment(true)

    try {
      // Sprawdź czy tutor ma już ten przedmiot z tym poziomem
      const { data: existingTutorSubject } = await supabase
        .from('tutor_subjects')
        .select('*')
        .eq('tutor_id', enrollmentData.tutor_id)
        .eq('subject_id', enrollmentData.subject_id)
        .single()

      // Jeśli nie ma, dodaj wpis do tutor_subjects
      if (!existingTutorSubject) {
        const { error: tutorSubjectError } = await supabase
          .from('tutor_subjects')
          .insert({
            tutor_id: enrollmentData.tutor_id,
            subject_id: enrollmentData.subject_id,
            level: enrollmentData.level
          } as any)

        if (tutorSubjectError) {
          console.error('Błąd podczas dodawania przedmiotu dla tutora:', tutorSubjectError)
          // Kontynuuj mimo błędu - tutor może już mieć ten przedmiot
        }
      }

      // Dodaj enrollment
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          subject_id: enrollmentData.subject_id,
          tutor_id: enrollmentData.tutor_id,
          start_date: enrollmentData.start_date,
          status: 'active'
        } as any)

      if (error) {
        console.error('Błąd podczas dodawania zapisu:', error)
        toast.error("Nie udało się dodać zapisu", {
          description: error.message
        })
        setIsAddingEnrollment(false)
        return
      }

      toast.success("Uczeń został przypisany do przedmiotu", {
        description: `Poziom: ${getLevelLabel(enrollmentData.level)}`
      })
      
      // Reset formularza
      setEnrollmentData({
        subject_id: "",
        tutor_id: "",
        level: "basic",
        start_date: new Date().toISOString().split('T')[0],
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error('Błąd:', error)
      toast.error("Wystąpił nieoczekiwany błąd", {
        description: error.message
      })
    } finally {
      setIsAddingEnrollment(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentId) return

    if (!studentData.first_name || !studentData.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko są wymagane"
      })
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        first_name: studentData.first_name.trim(),
        last_name: studentData.last_name.trim(),
        notes: studentData.notes.trim() || null,
        active: studentData.active,
        updated_at: new Date().toISOString()
      }
      
      const result: any = await (supabase
        .from('students') as any)
        .update(updateData)
        .eq('id', studentId)

      const { error } = result

      if (error) {
        console.error('Błąd podczas zapisywania:', error)
        toast.error("Nie udało się zapisać danych", {
          description: error.message
        })
        setIsLoading(false)
        return
      }

      toast.success("Dane ucznia zostały zaktualizowane")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error('Błąd:', error)
      toast.error("Wystąpił nieoczekiwany błąd", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!studentId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj ucznia</DialogTitle>
          <DialogDescription>
            Zaktualizuj podstawowe dane ucznia
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ładowanie danych...
          </div>
        ) : (
          <>
            <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">
                  Imię <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_first_name"
                  placeholder="Jan"
                  value={studentData.first_name}
                  onChange={(e) => setStudentData({ 
                    ...studentData, 
                    first_name: e.target.value 
                  })}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">
                  Nazwisko <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_last_name"
                  placeholder="Kowalski"
                  value={studentData.last_name}
                  onChange={(e) => setStudentData({ 
                    ...studentData, 
                    last_name: e.target.value 
                  })}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_active"
                checked={studentData.active}
                onCheckedChange={(checked) => setStudentData({ 
                  ...studentData, 
                  active: checked as boolean 
                })}
                disabled={isLoading}
              />
              <Label htmlFor="edit_active" className="cursor-pointer">
                Uczeń aktywny
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notatki</Label>
              <Textarea
                id="edit_notes"
                placeholder="Dodatkowe informacje o uczniu..."
                value={studentData.notes}
                onChange={(e) => setStudentData({ 
                  ...studentData, 
                  notes: e.target.value 
                })}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
              </Button>
            </div>
          </form>

          {/* Sekcja przypisywania do przedmiotu */}
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Przypisz do przedmiotu</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Dodaj ucznia do przedmiotu i przypisz korepetytora
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="enrollment_subject">
                  Przedmiot <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={enrollmentData.subject_id}
                  onValueChange={(value) => setEnrollmentData({ 
                    ...enrollmentData, 
                    subject_id: value 
                  })}
                  disabled={isAddingEnrollment}
                >
                  <SelectTrigger id="enrollment_subject">
                    <SelectValue placeholder="Wybierz przedmiot" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        Brak dostępnych przedmiotów
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollment_tutor">
                  Korepetytor <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={enrollmentData.tutor_id}
                  onValueChange={(value) => setEnrollmentData({ 
                    ...enrollmentData, 
                    tutor_id: value 
                  })}
                  disabled={isAddingEnrollment}
                >
                  <SelectTrigger id="enrollment_tutor">
                    <SelectValue placeholder="Wybierz korepetytora" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.length > 0 ? (
                      tutors.map((tutor) => (
                        <SelectItem key={tutor.id} value={tutor.id}>
                          {tutor.first_name} {tutor.last_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-tutors" disabled>
                        Brak dostępnych korepetytorów
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollment_level">
                  Poziom <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={enrollmentData.level}
                  onValueChange={(value: any) => setEnrollmentData({ 
                    ...enrollmentData, 
                    level: value 
                  })}
                  disabled={isAddingEnrollment}
                >
                  <SelectTrigger id="enrollment_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Podstawowy</SelectItem>
                    <SelectItem value="intermediate">Średni</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                    <SelectItem value="expert">Ekspercki</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enrollment_start_date">Data rozpoczęcia</Label>
                <Input
                  id="enrollment_start_date"
                  type="date"
                  value={enrollmentData.start_date}
                  onChange={(e) => setEnrollmentData({ 
                    ...enrollmentData, 
                    start_date: e.target.value 
                  })}
                  disabled={isAddingEnrollment}
                />
              </div>

              <Button
                type="button"
                onClick={handleAddEnrollment}
                disabled={isAddingEnrollment || !subjects.length || !tutors.length}
                className="w-full"
              >
                <IconPlus className="h-4 w-4 mr-2" />
                {isAddingEnrollment ? "Dodawanie..." : "Dodaj zapis"}
              </Button>
            </div>
          </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

