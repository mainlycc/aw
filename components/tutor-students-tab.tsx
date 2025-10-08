'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconTrash, IconUserPlus, IconUserCheck } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Student {
  id: string
  first_name: string
  last_name: string
  active: boolean
}

interface Enrollment {
  id: string
  status: string
  start_date: string
  rate: number | null
  level?: string | null
  students: Student
  subjects: {
    id: string
    name: string
  }
}

interface TutorStudentsTabProps {
  tutorId: string
  enrollments: Enrollment[]
  allStudents: Student[]
}

export function TutorStudentsTab({ tutorId, enrollments, allStudents }: TutorStudentsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Formularz dodawania ucznia
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    subject_id: '',
    rate: '',
    level: 'basic',
  })

  // Formularz tworzenia nowego ucznia
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    subject_id: '',
    rate: '',
    level: 'basic',
    notes: '',
  })

  // Pobierz listę przedmiotów (do wyboru przy przypisywaniu)
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])

  // Załaduj przedmioty przy otwieraniu dialogu
  const handleOpenDialog = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('active', true)
      .order('name')
    
    if (data) {
      setSubjects(data)
    }
    setShowAddDialog(true)
  }

  const handleAddStudent = async () => {
    if (!newEnrollment.student_id || !newEnrollment.subject_id) {
      toast.error('Uzupełnij wszystkie pola', {
        description: 'Wybierz ucznia i przedmiot',
      })
      return
    }

    setIsAdding(true)
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          tutor_id: tutorId,
          student_id: newEnrollment.student_id,
          subject_id: newEnrollment.subject_id,
          rate: newEnrollment.rate ? Number(newEnrollment.rate) : null,
          level: newEnrollment.level,
          status: 'active',
        })

      if (error) throw error

      toast.success('Uczeń został przypisany', {
        description: 'Zapis został utworzony pomyślnie',
      })

      setShowAddDialog(false)
      setNewEnrollment({ student_id: '', subject_id: '', rate: '', level: 'basic' })
      router.refresh()
    } catch (error: any) {
      console.error('Error adding enrollment:', error)
      toast.error('Błąd', {
        description: error.message || 'Nie udało się przypisać ucznia',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleCreateAndAssignStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.subject_id) {
      toast.error('Uzupełnij wymagane pola', {
        description: 'Imię, nazwisko i przedmiot są wymagane',
      })
      return
    }

    setIsCreating(true)
    try {
      // Pobierz aktualnego użytkownika
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Błąd autoryzacji')
        return
      }

      // 1. Utwórz nowego ucznia
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: newStudent.first_name.trim(),
          last_name: newStudent.last_name.trim(),
          notes: newStudent.notes.trim() || null,
          active: true,
          created_by: user.id
        })
        .select()
        .single()

      if (studentError) throw studentError

      // 2. Przypisz ucznia do korepetytora
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          tutor_id: tutorId,
          student_id: (studentRecord as any).id,
          subject_id: newStudent.subject_id,
          rate: newStudent.rate ? Number(newStudent.rate) : null,
          level: newStudent.level,
          status: 'active',
        })

      if (enrollmentError) throw enrollmentError

      toast.success('Uczeń został utworzony i przypisany', {
        description: `${newStudent.first_name} ${newStudent.last_name} został dodany do listy uczniów`,
      })

      setShowCreateDialog(false)
      setNewStudent({
        first_name: '',
        last_name: '',
        subject_id: '',
        rate: '',
        level: 'basic',
        notes: '',
      })
      router.refresh()
    } catch (error: any) {
      console.error('Error creating student:', error)
      toast.error('Błąd', {
        description: error.message || 'Nie udało się utworzyć ucznia',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć zapis dla ucznia ${studentName}?`)) {
      return
    }

    setIsDeleting(enrollmentId)
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)

      if (error) throw error

      toast.success('Zapis został usunięty', {
        description: `Usunięto zapis dla ucznia ${studentName}`,
      })

      router.refresh()
    } catch (error: any) {
      console.error('Error removing enrollment:', error)
      toast.error('Błąd', {
        description: error.message || 'Nie udało się usunąć zapisu',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
      on_hold: "outline",
    }
    
    const labels: Record<string, string> = {
      active: "Aktywny",
      completed: "Zakończony",
      cancelled: "Anulowany",
      on_hold: "Wstrzymany",
    }

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getLevelBadge = (level?: string | null) => {
    if (!level) return <span className="text-sm text-muted-foreground">—</span>
    
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
      <Badge className={levelColors[level] || levelColors.basic}>
        {levelLabels[level] || level}
      </Badge>
    )
  }

  // Filtruj uczniów, którzy już są przypisani
  const assignedStudentIds = enrollments.map(e => e.students.id)
  const availableStudents = allStudents.filter(s => !assignedStudentIds.includes(s.id))

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uczniowie korepetytora</CardTitle>
              <CardDescription>
                Lista uczniów przypisanych do tego korepetytora
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <IconUserPlus className="size-4 mr-2" />
                Dodaj nowego
              </Button>
              <Button onClick={handleOpenDialog}>
                <IconUserCheck className="size-4 mr-2" />
                Przypisz istniejącego
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconUserPlus className="size-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Brak przypisanych uczniów</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Kliknij &quot;Przypisz ucznia&quot; aby dodać pierwszego ucznia
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Uczeń</TableHead>
                    <TableHead>Przedmiot</TableHead>
                    <TableHead>Poziom</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data rozpoczęcia</TableHead>
                    <TableHead>Stawka</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.students.first_name} {enrollment.students.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{enrollment.subjects.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {getLevelBadge(enrollment.level)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(enrollment.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(enrollment.start_date)}
                      </TableCell>
                      <TableCell>
                        {enrollment.rate ? `${enrollment.rate} zł/h` : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => 
                            handleRemoveStudent(
                              enrollment.id,
                              `${enrollment.students.first_name} ${enrollment.students.last_name}`
                            )
                          }
                          disabled={isDeleting === enrollment.id}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog tworzenia nowego ucznia */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dodaj nowego ucznia</DialogTitle>
            <DialogDescription>
              Utwórz nowego ucznia i automatycznie przypisz go do korepetytora
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Imię <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Jan"
                  value={newStudent.first_name}
                  onChange={(e) => 
                    setNewStudent({ ...newStudent, first_name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nazwisko <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Kowalski"
                  value={newStudent.last_name}
                  onChange={(e) => 
                    setNewStudent({ ...newStudent, last_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Przedmiot <span className="text-destructive">*</span>
              </label>
              <Select
                value={newStudent.subject_id}
                onValueChange={(value) => 
                  setNewStudent({ ...newStudent, subject_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz przedmiot" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Poziom nauczania</label>
              <Select
                value={newStudent.level}
                onValueChange={(value) => 
                  setNewStudent({ ...newStudent, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Podstawowy</SelectItem>
                  <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                  <SelectItem value="advanced">Zaawansowany</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stawka (zł/h) - opcjonalne</label>
              <Input
                type="number"
                placeholder="np. 50"
                value={newStudent.rate}
                onChange={(e) => 
                  setNewStudent({ ...newStudent, rate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notatki - opcjonalne</label>
              <Textarea
                placeholder="Dodatkowe informacje o uczniu..."
                value={newStudent.notes}
                onChange={(e) => 
                  setNewStudent({ ...newStudent, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setNewStudent({
                  first_name: '',
                  last_name: '',
                  subject_id: '',
                  rate: '',
                  level: 'basic',
                  notes: '',
                })
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleCreateAndAssignStudent} disabled={isCreating}>
              {isCreating ? 'Tworzenie...' : 'Utwórz i przypisz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog przypisywania istniejącego ucznia */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przypisz ucznia do korepetytora</DialogTitle>
            <DialogDescription>
              Wybierz ucznia i przedmiot, aby utworzyć nowy zapis
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Uczeń</label>
              <Select
                value={newEnrollment.student_id}
                onValueChange={(value) => 
                  setNewEnrollment({ ...newEnrollment, student_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz ucznia" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Wszyscy uczniowie są już przypisani
                    </div>
                  ) : (
                    availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Przedmiot</label>
              <Select
                value={newEnrollment.subject_id}
                onValueChange={(value) => 
                  setNewEnrollment({ ...newEnrollment, subject_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz przedmiot" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Poziom nauczania</label>
              <Select
                value={newEnrollment.level}
                onValueChange={(value) => 
                  setNewEnrollment({ ...newEnrollment, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Podstawowy</SelectItem>
                  <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                  <SelectItem value="advanced">Zaawansowany</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stawka (zł/h) - opcjonalne</label>
              <Input
                type="number"
                placeholder="np. 50"
                value={newEnrollment.rate}
                onChange={(e) => 
                  setNewEnrollment({ ...newEnrollment, rate: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                setNewEnrollment({ student_id: '', subject_id: '', rate: '', level: 'basic' })
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleAddStudent} disabled={isAdding}>
              {isAdding ? 'Dodawanie...' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

