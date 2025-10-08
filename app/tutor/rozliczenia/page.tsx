"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PageTitleSetter } from "@/components/page-title-setter"
import { Plus } from "lucide-react"
import { BillingMonthCard } from "@/components/billing-month-card"
import { AddMonthDialog } from "@/components/add-month-dialog"
import { ManageStudentDialog } from "@/components/manage-student-dialog"
import { createClient } from "@/lib/supabase/client"
import { 
  getTutorBillingMonths, 
  createBillingMonth, 
  updateBillingMonth, 
  deleteBillingMonth,
  upsertStudentHours,
  deleteStudentHours,
  getCurrentTutorId
} from "@/lib/supabase/billing-queries"
import type { BillingMonth, StudentHours } from "@/types/billing"
import { toast } from "sonner"

export default function TutorRozliczeniaPage() {
  const [months, setMonths] = useState<BillingMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false)
  const [isManageStudentOpen, setIsManageStudentOpen] = useState(false)
  const [editingMonth, setEditingMonth] = useState<BillingMonth | null>(null)
  const [currentMonthId, setCurrentMonthId] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentHours | null>(null)

  const supabase = createClient()

  // Wczytaj dane z Supabase przy starcie
  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      
      // Pobierz ID korepetytora
      const { data: currentTutorId, error: tutorError } = await getCurrentTutorId(supabase)
      if (tutorError || !currentTutorId) {
        toast.error("Nie można pobrać danych korepetytora")
        return
      }
      
      setTutorId(currentTutorId)

      // Pobierz miesiące rozliczeniowe
      const { data: billingData, error } = await getTutorBillingMonths(supabase, currentTutorId)
      
      if (error) {
        toast.error("Błąd wczytywania rozliczeń: " + error.message)
        return
      }

      // Przekształć dane z bazy na format używany w aplikacji
      const transformedMonths: BillingMonth[] = (billingData || []).map((month: any) => ({
        id: month.id,
        name: month.month_name,
        year: month.month_year,
        students: (month.billing_student_hours || []).map((sh: any) => ({
          id: sh.id,
          studentId: sh.student_id,
          hours: sh.hours
        }))
      }))

      setMonths(transformedMonths)
    } catch (error) {
      console.error("Błąd wczytywania danych:", error)
      toast.error("Wystąpił błąd podczas wczytywania danych")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMonth = async (monthData: Omit<BillingMonth, "id" | "students">) => {
    if (!tutorId) return

    try {
      if (editingMonth) {
        // Edycja istniejącego miesiąca
        const { error } = await updateBillingMonth(supabase, editingMonth.id, {
          month_name: monthData.name,
          month_year: monthData.year
        })

        if (error) {
          toast.error("Błąd aktualizacji miesiąca: " + error.message)
          return
        }

        toast.success("Miesiąc zaktualizowany pomyślnie")
        setEditingMonth(null)
      } else {
        // Dodawanie nowego miesiąca
        const { error } = await createBillingMonth(supabase, {
          tutor_id: tutorId,
          month_name: monthData.name,
          month_year: monthData.year
        })

        if (error) {
          toast.error("Błąd dodawania miesiąca: " + error.message)
          return
        }

        toast.success("Miesiąc dodany pomyślnie")
      }

      // Odśwież dane
      loadBillingData()
    } catch (error) {
      console.error("Błąd:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    }
  }

  const handleDeleteMonth = async (monthId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten miesiąc? Wszystkie dane zostaną utracone.")) {
      return
    }

    try {
      const { error } = await deleteBillingMonth(supabase, monthId)

      if (error) {
        toast.error("Błąd usuwania miesiąca: " + error.message)
        return
      }

      toast.success("Miesiąc usunięty pomyślnie")
      loadBillingData()
    } catch (error) {
      console.error("Błąd:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    }
  }

  const handleEditMonth = (month: BillingMonth) => {
    setEditingMonth(month)
    setIsAddMonthOpen(true)
  }

  const handleAddStudent = (monthId: string) => {
    setCurrentMonthId(monthId)
    setEditingStudent(null)
    setIsManageStudentOpen(true)
  }

  const handleEditStudent = (monthId: string, student: StudentHours) => {
    setCurrentMonthId(monthId)
    setEditingStudent(student)
    setIsManageStudentOpen(true)
  }

  const handleSaveStudent = async (student: StudentHours) => {
    if (!currentMonthId) return

    try {
      const { error } = await upsertStudentHours(supabase, {
        id: editingStudent ? student.id : undefined,
        billing_month_id: currentMonthId,
        student_id: student.studentId,
        hours: student.hours
      })

      if (error) {
        toast.error("Błąd zapisywania danych ucznia: " + error.message)
        return
      }

      toast.success(editingStudent ? "Dane ucznia zaktualizowane" : "Uczeń dodany pomyślnie")
      setEditingStudent(null)
      setCurrentMonthId(null)
      loadBillingData()
    } catch (error) {
      console.error("Błąd:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    }
  }

  // Pobierz IDs uczniów już dodanych do danego miesiąca
  const getExistingStudentIds = (monthId: string): string[] => {
    const month = months.find(m => m.id === monthId)
    return month ? month.students.map(s => s.studentId) : []
  }

  const handleDeleteStudent = async (monthId: string, studentHoursId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego ucznia?")) {
      return
    }

    try {
      const { error } = await deleteStudentHours(supabase, studentHoursId)

      if (error) {
        toast.error("Błąd usuwania ucznia: " + error.message)
        return
      }

      toast.success("Uczeń usunięty pomyślnie")
      loadBillingData()
    } catch (error) {
      console.error("Błąd:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    }
  }

  const totalHours = months.reduce(
    (sum, month) => sum + month.students.reduce((s, student) => s + student.hours, 0),
    0
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitleSetter title="Rozliczenia" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ładowanie rozliczeń...</p>
        </div>
      </div>
    )
  }

  if (!tutorId) {
    return (
      <div className="space-y-6">
        <PageTitleSetter title="Rozliczenia" />
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nie znaleziono profilu korepetytora. Skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTitleSetter title="Rozliczenia" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rozliczenia</h1>
          <p className="text-muted-foreground">
            Zarządzaj godzinami zajęć z uczniami
          </p>
        </div>
        <Button onClick={() => {
          setEditingMonth(null)
          setIsAddMonthOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj miesiąc
        </Button>
      </div>

      {/* Podsumowanie */}
      {months.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Suma wszystkich godzin</p>
              <p className="text-3xl font-bold">{totalHours}h</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Liczba miesięcy</p>
              <p className="text-3xl font-bold">{months.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista miesięcy */}
      {months.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nie masz jeszcze żadnych miesięcy rozliczeniowych
          </p>
          <Button onClick={() => setIsAddMonthOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj pierwszy miesiąc
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {months.map((month) => (
            <BillingMonthCard
              key={month.id}
              month={month}
              onEdit={handleEditMonth}
              onDelete={handleDeleteMonth}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
            />
          ))}
        </div>
      )}

      {/* Dialogi */}
      <AddMonthDialog
        open={isAddMonthOpen}
        onOpenChange={(open) => {
          setIsAddMonthOpen(open)
          if (!open) setEditingMonth(null)
        }}
        onSave={handleAddMonth}
        editingMonth={editingMonth}
      />

      <ManageStudentDialog
        open={isManageStudentOpen}
        onOpenChange={(open) => {
          setIsManageStudentOpen(open)
          if (!open) {
            setEditingStudent(null)
            setCurrentMonthId(null)
          }
        }}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
        existingStudentIds={currentMonthId ? getExistingStudentIds(currentMonthId) : []}
      />
    </div>
  )
}
