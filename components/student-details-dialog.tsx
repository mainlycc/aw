"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconEye, IconLoader2, IconUserPlus, IconX, IconEdit } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface StudentDetailsDialogProps {
  enrollmentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface StudentDetails {
  enrollment: {
    id: string
    status: string
    start_date: string
    end_date: string | null
    created_at: string
  }
  student: {
    id: string
    first_name: string
    last_name: string
    active: boolean
    notes: string | null
    created_at: string
  }
  subject: {
    id: string
    name: string
    color: string | null
  }
  tutor: {
    id: string
    first_name: string
    last_name: string
  }
  parents: Array<{
    id: string
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    relation: string
    is_primary: boolean
  }>
  tutorSubjectLevel?: string
}

export function StudentDetailsDialog({ 
  enrollmentId, 
  open, 
  onOpenChange 
}: StudentDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<StudentDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Dane formularza edycji ucznia
  const [studentFormData, setStudentFormData] = useState({
    first_name: "",
    last_name: "",
    notes: "",
    active: true
  })

  // Dane formularza nowego rodzica
  const [newParentData, setNewParentData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    relation: "guardian" as "guardian" | "mother" | "father" | "grandparent" | "other",
    is_primary: false
  })
  const [isAddingParent, setIsAddingParent] = useState(false)

  useEffect(() => {
    if (open && !details) {
      fetchStudentDetails()
    }
  }, [open])

  const fetchStudentDetails = async () => {
    setLoading(true)
    try {
      // Pobierz dane enrollment z relacjami
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          students (*),
          subjects (*),
          tutors (*)
        `)
        .eq('id', enrollmentId)
        .single()

      if (enrollmentError) throw enrollmentError
      if (!enrollmentData) throw new Error('Nie znaleziono danych ucznia')

      // Pobierz rodziców ucznia
      const { data: parentsData } = await supabase
        .from('student_parents')
        .select(`
          relation,
          is_primary,
          parents (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('student_id', enrollmentData.students.id)

      // Pobierz poziom przedmiotu tutora
      const { data: tutorSubjectData } = await supabase
        .from('tutor_subjects')
        .select('level')
        .eq('tutor_id', enrollmentData.tutor_id)
        .eq('subject_id', enrollmentData.subject_id)
        .single()

      const parents = parentsData?.map((item: any) => ({
        id: item.parents.id,
        first_name: item.parents.first_name,
        last_name: item.parents.last_name,
        email: item.parents.email,
        phone: item.parents.phone,
        relation: item.relation,
        is_primary: item.is_primary
      })) || []

      const studentDetails = {
        enrollment: enrollmentData as any,
        student: enrollmentData.students as any,
        subject: enrollmentData.subjects as any,
        tutor: enrollmentData.tutors as any,
        parents,
        tutorSubjectLevel: tutorSubjectData?.level
      }

      setDetails(studentDetails)
      
      // Ustaw dane formularza
      setStudentFormData({
        first_name: studentDetails.student.first_name,
        last_name: studentDetails.student.last_name,
        notes: studentDetails.student.notes || "",
        active: studentDetails.student.active
      })

    } catch (error: any) {
      console.error('Błąd podczas pobierania szczegółów:', error)
      toast.error("Nie udało się pobrać danych ucznia", {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStudent = async () => {
    if (!details) return

    if (!studentFormData.first_name || !studentFormData.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko są wymagane"
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('students')
        .update({
          first_name: studentFormData.first_name.trim(),
          last_name: studentFormData.last_name.trim(),
          notes: studentFormData.notes.trim() || null,
          active: studentFormData.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', details.student.id)

      if (error) throw error

      toast.success("Dane ucznia zostały zaktualizowane")
      setIsEditing(false)
      
      // Odśwież dane
      setDetails(null)
      fetchStudentDetails()
      router.refresh()
    } catch (error: any) {
      console.error('Błąd podczas zapisywania:', error)
      toast.error("Nie udało się zapisać danych", {
        description: error.message
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddParent = async () => {
    if (!details) return

    if (!newParentData.first_name || !newParentData.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko rodzica są wymagane"
      })
      return
    }

    setIsAddingParent(true)

    try {
      // 1. Utwórz rodzica
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .insert({
          first_name: newParentData.first_name.trim(),
          last_name: newParentData.last_name.trim(),
          email: newParentData.email.trim() || null,
          phone: newParentData.phone.trim() || null
        })
        .select()
        .single()

      if (parentError) throw parentError

      // 2. Połącz rodzica z uczniem
      const { error: relationError } = await supabase
        .from('student_parents')
        .insert({
          student_id: details.student.id,
          parent_id: parentData.id,
          relation: newParentData.relation,
          is_primary: newParentData.is_primary
        })

      if (relationError) throw relationError

      toast.success("Rodzic został dodany")
      
      // Reset formularza
      setNewParentData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        relation: "guardian",
        is_primary: false
      })

      // Odśwież dane
      setDetails(null)
      fetchStudentDetails()
    } catch (error: any) {
      console.error('Błąd podczas dodawania rodzica:', error)
      toast.error("Nie udało się dodać rodzica", {
        description: error.message
      })
    } finally {
      setIsAddingParent(false)
    }
  }

  const handleRemoveParent = async (parentId: string) => {
    if (!details) return
    
    if (!confirm('Czy na pewno chcesz usunąć tego rodzica?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('student_parents')
        .delete()
        .eq('student_id', details.student.id)
        .eq('parent_id', parentId)

      if (error) throw error

      toast.success("Rodzic został usunięty")
      
      // Odśwież dane
      setDetails(null)
      fetchStudentDetails()
    } catch (error: any) {
      console.error('Błąd podczas usuwania rodzica:', error)
      toast.error("Nie udało się usunąć rodzica", {
        description: error.message
      })
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'Aktywny'
      case 'completed': return 'Zakończony'
      case 'on_hold': return 'Wstrzymany'
      case 'cancelled': return 'Anulowany'
      default: return status
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch(status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'on_hold': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'default'
    }
  }

  const getLevelLabel = (level?: string) => {
    switch(level) {
      case 'basic': return 'Podstawowy'
      case 'intermediate': return 'Średni'
      case 'advanced': return 'Zaawansowany'
      default: return '—'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {details ? `${details.student.first_name} ${details.student.last_name}` : 'Szczegóły ucznia'}
          </DialogTitle>
          <DialogDescription>
            Pełne informacje o uczniu, kursie i rodzicach
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Dane ucznia</TabsTrigger>
              <TabsTrigger value="parents">Rodzice ({details.parents.length})</TabsTrigger>
            </TabsList>

            {/* Zakładka: Dane ucznia */}
            <TabsContent value="student" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Podstawowe informacje</h3>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <IconEdit className="h-4 w-4" />
                    Edytuj
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Anuluj
                    </Button>
                    <Button size="sm" onClick={handleSaveStudent} disabled={isSaving}>
                      {isSaving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Zapisz"}
                    </Button>
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_first_name">Imię</Label>
                      {isEditing ? (
                        <Input
                          id="edit_first_name"
                          value={studentFormData.first_name}
                          onChange={(e) => setStudentFormData({ 
                            ...studentFormData, 
                            first_name: e.target.value 
                          })}
                          disabled={isSaving}
                        />
                      ) : (
                        <p className="text-sm">{details.student.first_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_last_name">Nazwisko</Label>
                      {isEditing ? (
                        <Input
                          id="edit_last_name"
                          value={studentFormData.last_name}
                          onChange={(e) => setStudentFormData({ 
                            ...studentFormData, 
                            last_name: e.target.value 
                          })}
                          disabled={isSaving}
                        />
                      ) : (
                        <p className="text-sm">{details.student.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Status ucznia</Label>
                    <div>
                      <Badge variant={details.student.active ? "default" : "secondary"}>
                        {details.student.active ? "Aktywny" : "Nieaktywny"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_notes">Notatki</Label>
                    {isEditing ? (
                      <Textarea
                        id="edit_notes"
                        value={studentFormData.notes}
                        onChange={(e) => setStudentFormData({ 
                          ...studentFormData, 
                          notes: e.target.value 
                        })}
                        disabled={isSaving}
                        rows={4}
                        placeholder="Dodatkowe informacje o uczniu..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {details.student.notes || "Brak notatek"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <h3 className="text-sm font-medium">Informacje o kursie</h3>
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Przedmiot</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{details.subject.name}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Poziom nauczania</label>
                    <div className="mt-1">
                      <Badge 
                        variant="secondary"
                        style={{
                          backgroundColor: details.tutorSubjectLevel === 'advanced' ? '#fee2e2' : 
                                         details.tutorSubjectLevel === 'intermediate' ? '#fed7aa' : '#dcfce7',
                          color: details.tutorSubjectLevel === 'advanced' ? '#dc2626' : 
                                 details.tutorSubjectLevel === 'intermediate' ? '#ea580c' : '#16a34a'
                        }}
                      >
                        {getLevelLabel(details.tutorSubjectLevel)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status zapisu</label>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(details.enrollment.status)}>
                        {getStatusLabel(details.enrollment.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data rozpoczęcia</label>
                    <p className="text-sm mt-1">
                      {new Date(details.enrollment.start_date).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  {details.enrollment.end_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data zakończenia</label>
                      <p className="text-sm mt-1">
                        {new Date(details.enrollment.end_date).toLocaleDateString('pl-PL', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Korepetytor</label>
                    <p className="text-sm mt-1">{details.tutor.first_name} {details.tutor.last_name}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Zakładka: Rodzice */}
            <TabsContent value="parents" className="space-y-4">
              <h3 className="text-sm font-medium">Lista rodziców/opiekunów</h3>
              
              {/* Formularz dodawania nowego rodzica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dodaj rodzica/opiekuna</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parent_first_name">
                        Imię <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="parent_first_name"
                        placeholder="Anna"
                        value={newParentData.first_name}
                        onChange={(e) => setNewParentData({ 
                          ...newParentData, 
                          first_name: e.target.value 
                        })}
                        disabled={isAddingParent}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent_last_name">
                        Nazwisko <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="parent_last_name"
                        placeholder="Kowalska"
                        value={newParentData.last_name}
                        onChange={(e) => setNewParentData({ 
                          ...newParentData, 
                          last_name: e.target.value 
                        })}
                        disabled={isAddingParent}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parent_email">Email</Label>
                      <Input
                        id="parent_email"
                        type="email"
                        placeholder="anna.kowalska@example.com"
                        value={newParentData.email}
                        onChange={(e) => setNewParentData({ 
                          ...newParentData, 
                          email: e.target.value 
                        })}
                        disabled={isAddingParent}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent_phone">Telefon</Label>
                      <Input
                        id="parent_phone"
                        type="tel"
                        placeholder="+48 123 456 789"
                        value={newParentData.phone}
                        onChange={(e) => setNewParentData({ 
                          ...newParentData, 
                          phone: e.target.value 
                        })}
                        disabled={isAddingParent}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent_relation">Relacja</Label>
                    <Select
                      value={newParentData.relation}
                      onValueChange={(value: any) => setNewParentData({ 
                        ...newParentData, 
                        relation: value 
                      })}
                      disabled={isAddingParent}
                    >
                      <SelectTrigger id="parent_relation">
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
                  </div>

                  <Button 
                    onClick={handleAddParent} 
                    disabled={isAddingParent}
                    className="w-full"
                  >
                    {isAddingParent ? (
                      <>
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                        Dodawanie...
                      </>
                    ) : (
                      <>
                        <IconUserPlus className="h-4 w-4" />
                        Dodaj rodzica
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Separator />

              {/* Lista rodziców */}
              {details.parents.length > 0 ? (
                <div className="space-y-3">
                  {details.parents.map((parent) => (
                    <Card key={parent.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {parent.first_name} {parent.last_name}
                              </p>
                              {parent.is_primary && (
                                <Badge variant="outline" className="text-xs">Główny kontakt</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {getRelationLabel(parent.relation)}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {parent.email && (
                                <div>
                                  <label className="text-xs text-muted-foreground">Email</label>
                                  <p className="text-sm">{parent.email}</p>
                                </div>
                              )}
                              {parent.phone && (
                                <div>
                                  <label className="text-xs text-muted-foreground">Telefon</label>
                                  <p className="text-sm">{parent.phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParent(parent.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <IconX className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                      Brak dodanych rodziców lub opiekunów
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nie udało się załadować danych
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

