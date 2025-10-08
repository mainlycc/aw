"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTutorStudents } from "@/hooks/use-tutor-students"
import type { StudentHours } from "@/types/billing"

interface ManageStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (student: StudentHours) => void
  editingStudent?: StudentHours | null
  existingStudentIds?: string[]  // IDs uczniów już dodanych do miesiąca
}

export function ManageStudentDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  editingStudent,
  existingStudentIds = []
}: ManageStudentDialogProps) {
  const { students, loading } = useTutorStudents()
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [hours, setHours] = useState("")

  useEffect(() => {
    if (editingStudent) {
      setSelectedStudentId(editingStudent.studentId)
      setHours(editingStudent.hours.toString())
    } else {
      setSelectedStudentId("")
      setHours("")
    }
  }, [editingStudent, open])

  const handleSave = () => {
    if (!selectedStudentId || !hours) return

    const hoursNum = parseFloat(hours)
    if (isNaN(hoursNum) || hoursNum < 0) return

    onSave({
      id: editingStudent?.id || crypto.randomUUID(),
      studentId: selectedStudentId,
      hours: hoursNum
    })

    // Reset form
    setSelectedStudentId("")
    setHours("")
    onOpenChange(false)
  }

  // Filtruj uczniów - pokaż tylko tych, którzy nie są jeszcze dodani (chyba że edytujemy)
  const availableStudents = students.filter(
    s => !existingStudentIds.includes(s.id) || s.id === editingStudent?.studentId
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingStudent ? "Edytuj ucznia" : "Dodaj ucznia"}
          </DialogTitle>
          <DialogDescription>
            {editingStudent 
              ? "Zmień liczbę godzin dla tego ucznia"
              : "Wybierz ucznia z listy i wprowadź liczbę godzin"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student">Uczeń</Label>
            {loading ? (
              <div className="text-sm text-muted-foreground">Ładowanie uczniów...</div>
            ) : availableStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {students.length === 0 
                  ? "Brak przypisanych uczniów. Skontaktuj się z administratorem."
                  : "Wszyscy uczniowie zostali już dodani do tego miesiąca."
                }
              </div>
            ) : (
              <Select 
                value={selectedStudentId} 
                onValueChange={setSelectedStudentId}
                disabled={!!editingStudent} // Nie można zmienić ucznia podczas edycji
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Wybierz ucznia" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                      {!student.active && " (nieaktywny)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hours">Liczba godzin</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedStudentId || !hours || loading || availableStudents.length === 0}
          >
            {editingStudent ? "Zapisz zmiany" : "Dodaj ucznia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
