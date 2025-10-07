"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconUserPlus, IconUsers, IconX } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface TutorSubject {
  id: string
  name: string
  level: 'basic' | 'intermediate' | 'advanced'
}

interface Student {
  id: string
  first_name: string
  last_name: string
  active: boolean
  notes: string | null
}

interface AddStudentDialogProps {
  tutorId: string
  tutorSubjects: TutorSubject[]
  existingStudents: Student[]
}

export function AddStudentDialog({ 
  tutorId, 
  tutorSubjects,
  existingStudents 
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("new")
  const router = useRouter()
  const supabase = createClient()

  // Formularz dla nowego ucznia
  const [newStudentData, setNewStudentData] = useState({
    first_name: "",
    last_name: "",
    notes: "",
    subject_id: "",
    start_date: new Date().toISOString().split('T')[0],
  })

  // Rodzice nowego ucznia
  const [newStudentParents, setNewStudentParents] = useState<Array<{
    first_name: string
    last_name: string
    email: string
    phone: string
    relation: 'guardian' | 'mother' | 'father' | 'grandparent' | 'other'
    is_primary: boolean
  }>>([])

  // Formularz nowego rodzica
  const [newParentForm, setNewParentForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    relation: "guardian" as 'guardian' | 'mother' | 'father' | 'grandparent' | 'other',
    is_primary: false
  })

  // Formularz dla istniejącego ucznia
  const [existingStudentData, setExistingStudentData] = useState({
    student_id: "",
    subject_id: "",
    start_date: new Date().toISOString().split('T')[0],
  })

  // Funkcja do pobrania poziomu dla wybranego przedmiotu
  const getSubjectLevel = (subjectId: string) => {
    return tutorSubjects.find(s => s.id === subjectId)?.level || 'basic'
  }

  const getLevelLabel = (level: string) => {
    switch(level) {
      case 'basic': return 'Podstawowy'
      case 'intermediate': return 'Średni'
      case 'advanced': return 'Zaawansowany'
      default: return level
    }
  }

  const getRelationLabel = (relation: string) => {
    switch(relation) {
      case 'mother': return 'Matka'
      case 'father': return 'Ojciec'
      case 'guardian': return 'Opiekun'
      case 'grandparent': return 'Dziadek/Babcia'
      case 'other': return 'Inne'
      default: return relation
    }
  }

  const handleAddParent = () => {
    if (!newParentForm.first_name || !newParentForm.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko rodzica są wymagane"
      })
      return
    }

    // Jeśli to jest pierwszy rodzic, ustaw jako główny kontakt
    const isFirst = newStudentParents.length === 0

    setNewStudentParents([
      ...newStudentParents, 
      { 
        ...newParentForm,
        is_primary: isFirst ? true : newParentForm.is_primary
      }
    ])
    
    // Reset formularza
    setNewParentForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      relation: "guardian",
      is_primary: false
    })
    
    toast.success("Rodzic dodany do listy")
  }

  const handleRemoveParent = (index: number) => {
    const updated = newStudentParents.filter((_, i) => i !== index)
    setNewStudentParents(updated)
    toast.success("Rodzic usunięty z listy")
  }

  // Dodaj nowego ucznia
  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Walidacja
      if (!newStudentData.first_name || !newStudentData.last_name) {
        toast.error("Wypełnij wymagane pola", {
          description: "Imię i nazwisko są wymagane"
        })
        setIsLoading(false)
        return
      }

      if (!newStudentData.subject_id) {
        toast.error("Wybierz przedmiot")
        setIsLoading(false)
        return
      }

      // Pobierz aktualnego użytkownika
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Błąd autoryzacji")
        setIsLoading(false)
        return
      }

      // 1. Utwórz nowego ucznia
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: newStudentData.first_name.trim(),
          last_name: newStudentData.last_name.trim(),
          notes: newStudentData.notes || null,
          active: true,
          created_by: user.id
        } as any)
        .select()
        .single()

      if (studentError) {
        console.error("Student error:", studentError)
        toast.error("Błąd podczas tworzenia ucznia", {
          description: studentError.message
        })
        setIsLoading(false)
        return
      }

      // 2. Utwórz enrollment (przypisanie)
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: (studentData as any).id,
          subject_id: newStudentData.subject_id,
          tutor_id: tutorId,
          rate: null, // Stawka nie jest już wybierana przez tutora
          start_date: newStudentData.start_date,
          status: 'active'
        } as any)

      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError)
        toast.error("Błąd podczas przypisywania ucznia", {
          description: enrollmentError.message
        })
        setIsLoading(false)
        return
      }

      // 3. Dodaj rodziców (jeśli są)
      if (newStudentParents.length > 0) {
        for (const parentData of newStudentParents) {
          // Utwórz rodzica
          const { data: parentRecord, error: parentError } = await supabase
            .from('parents')
            .insert({
              first_name: parentData.first_name.trim(),
              last_name: parentData.last_name.trim(),
              email: parentData.email.trim() || null,
              phone: parentData.phone.trim() || null
            } as any)
            .select()
            .single()

          if (parentError) {
            console.error("Parent error:", parentError)
            // Kontynuuj mimo błędu z rodzicem
            continue
          }

          // Połącz rodzica z uczniem
          await supabase
            .from('student_parents')
            .insert({
              student_id: (studentData as any).id,
              parent_id: (parentRecord as any).id,
              relation: parentData.relation,
              is_primary: parentData.is_primary
            } as any)
        }
      }

      toast.success("Uczeń został dodany", {
        description: `${newStudentData.first_name} ${newStudentData.last_name} został pomyślnie przypisany${newStudentParents.length > 0 ? ` z ${newStudentParents.length} rodzicem/ami` : ''}`
      })

      // Reset formularzy
      setNewStudentData({
        first_name: "",
        last_name: "",
        notes: "",
        subject_id: "",
        start_date: new Date().toISOString().split('T')[0],
      })
      setNewStudentParents([])
      setNewParentForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        relation: "guardian",
        is_primary: false
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setIsLoading(false)
    }
  }

  // Przypisz istniejącego ucznia
  const handleAssignExistingStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Walidacja
      if (!existingStudentData.student_id) {
        toast.error("Wybierz ucznia")
        setIsLoading(false)
        return
      }

      if (!existingStudentData.subject_id) {
        toast.error("Wybierz przedmiot")
        setIsLoading(false)
        return
      }

      // Sprawdź czy ucznia nie ma już przypisanego
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', existingStudentData.student_id)
        .eq('tutor_id', tutorId)
        .eq('subject_id', existingStudentData.subject_id)
        .eq('status', 'active')
        .single()

      if (existingEnrollment) {
        toast.error("Ten uczeń jest już przypisany", {
          description: "Uczeń ma już aktywny zapis na ten przedmiot u Ciebie"
        })
        setIsLoading(false)
        return
      }

      // Utwórz enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: existingStudentData.student_id,
          subject_id: existingStudentData.subject_id,
          tutor_id: tutorId,
          rate: null, // Stawka nie jest już wybierana przez tutora
          start_date: existingStudentData.start_date,
          status: 'active'
        } as any)

      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError)
        toast.error("Błąd podczas przypisywania ucznia", {
          description: enrollmentError.message
        })
        setIsLoading(false)
        return
      }

      const student = existingStudents.find(s => s.id === existingStudentData.student_id)
      toast.success("Uczeń został przypisany", {
        description: student 
          ? `${student.first_name} ${student.last_name} został pomyślnie przypisany`
          : "Uczeń został pomyślnie przypisany"
      })

      // Reset formularza
      setExistingStudentData({
        student_id: "",
        subject_id: "",
        start_date: new Date().toISOString().split('T')[0],
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconUserPlus className="h-4 w-4" />
          Dodaj ucznia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj ucznia</DialogTitle>
          <DialogDescription>
            Utwórz nowego ucznia lub przypisz istniejącego do swoich przedmiotów
          </DialogDescription>
        </DialogHeader>

        {tutorSubjects.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Brak przedmiotów
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Aby móc dodawać uczniów, najpierw musisz dodać przedmioty do swojego profilu. 
                  Przejdź do zakładki <strong>Profil</strong> i uzupełnij swoje przedmioty z poziomami nauczania.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">
              <IconUserPlus className="h-4 w-4" />
              Nowy uczeń
            </TabsTrigger>
            <TabsTrigger value="existing">
              <IconUsers className="h-4 w-4" />
              Przypisz istniejącego
            </TabsTrigger>
          </TabsList>

          {/* Zakładka: Nowy uczeń */}
          <TabsContent value="new" className="space-y-4">
            <form onSubmit={handleAddNewStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Imię <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="Jan"
                    value={newStudentData.first_name}
                    onChange={(e) => setNewStudentData({ 
                      ...newStudentData, 
                      first_name: e.target.value 
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Nazwisko <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="Kowalski"
                    value={newStudentData.last_name}
                    onChange={(e) => setNewStudentData({ 
                      ...newStudentData, 
                      last_name: e.target.value 
                    })}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_subject">
                  Przedmiot <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newStudentData.subject_id}
                  onValueChange={(value) => setNewStudentData({ 
                    ...newStudentData, 
                    subject_id: value 
                  })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="new_subject">
                    <SelectValue placeholder="Wybierz przedmiot" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutorSubjects.length > 0 ? (
                      tutorSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({getLevelLabel(subject.level)})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        Brak przedmiotów - uzupełnij profil
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {newStudentData.subject_id && (
                  <p className="text-xs text-muted-foreground">
                    Poziom: <span className="font-medium">{getLevelLabel(getSubjectLevel(newStudentData.subject_id))}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_start_date">Data rozpoczęcia</Label>
                <Input
                  id="new_start_date"
                  type="date"
                  value={newStudentData.start_date}
                  onChange={(e) => setNewStudentData({ 
                    ...newStudentData, 
                    start_date: e.target.value 
                  })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notatki</Label>
                <Textarea
                  id="notes"
                  placeholder="Dodatkowe informacje o uczniu..."
                  value={newStudentData.notes}
                  onChange={(e) => setNewStudentData({ 
                    ...newStudentData, 
                    notes: e.target.value 
                  })}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Rodzice / Opiekunowie (opcjonalnie)</h4>
                
                {/* Lista dodanych rodziców */}
                {newStudentParents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {newStudentParents.map((parent, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-medium">
                            {parent.first_name} {parent.last_name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getRelationLabel(parent.relation)}
                          </Badge>
                          {parent.is_primary && (
                            <Badge variant="outline" className="text-xs">Główny</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParent(index)}
                          disabled={isLoading}
                        >
                          <IconX className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formularz dodawania rodzica */}
                <div className="space-y-3 p-3 bg-muted/50 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Imię rodzica"
                      value={newParentForm.first_name}
                      onChange={(e) => setNewParentForm({ 
                        ...newParentForm, 
                        first_name: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="Nazwisko rodzica"
                      value={newParentForm.last_name}
                      onChange={(e) => setNewParentForm({ 
                        ...newParentForm, 
                        last_name: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newParentForm.email}
                      onChange={(e) => setNewParentForm({ 
                        ...newParentForm, 
                        email: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                    <Input
                      type="tel"
                      placeholder="Telefon"
                      value={newParentForm.phone}
                      onChange={(e) => setNewParentForm({ 
                        ...newParentForm, 
                        phone: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <Select
                    value={newParentForm.relation}
                    onValueChange={(value: any) => setNewParentForm({ 
                      ...newParentForm, 
                      relation: value 
                    })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guardian">Opiekun prawny</SelectItem>
                      <SelectItem value="mother">Matka</SelectItem>
                      <SelectItem value="father">Ojciec</SelectItem>
                      <SelectItem value="grandparent">Dziadek/Babcia</SelectItem>
                      <SelectItem value="other">Inne</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParent}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <IconUserPlus className="h-4 w-4" />
                    Dodaj rodzica do listy
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Dodawanie..." : "Dodaj ucznia"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Zakładka: Przypisz istniejącego */}
          <TabsContent value="existing" className="space-y-4">
            <form onSubmit={handleAssignExistingStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existing_student">
                  Uczeń <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={existingStudentData.student_id}
                  onValueChange={(value) => setExistingStudentData({ 
                    ...existingStudentData, 
                    student_id: value 
                  })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="existing_student">
                    <SelectValue placeholder="Wybierz ucznia" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingStudents.length > 0 ? (
                      existingStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-students" disabled>
                        Brak dostępnych uczniów
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="existing_subject">
                  Przedmiot <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={existingStudentData.subject_id}
                  onValueChange={(value) => setExistingStudentData({ 
                    ...existingStudentData, 
                    subject_id: value 
                  })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="existing_subject">
                    <SelectValue placeholder="Wybierz przedmiot" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutorSubjects.length > 0 ? (
                      tutorSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({getLevelLabel(subject.level)})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        Brak przedmiotów - uzupełnij profil
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {existingStudentData.subject_id && (
                  <p className="text-xs text-muted-foreground">
                    Poziom: <span className="font-medium">{getLevelLabel(getSubjectLevel(existingStudentData.subject_id))}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="existing_start_date">Data rozpoczęcia</Label>
                <Input
                  id="existing_start_date"
                  type="date"
                  value={existingStudentData.start_date}
                  onChange={(e) => setExistingStudentData({ 
                    ...existingStudentData, 
                    start_date: e.target.value 
                  })}
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Anuluj
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Przypisywanie..." : "Przypisz ucznia"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

