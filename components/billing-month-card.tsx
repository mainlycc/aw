"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, UserPlus } from "lucide-react"
import { useTutorStudents } from "@/hooks/use-tutor-students"
import type { BillingMonth, StudentHours } from "@/types/billing"

interface BillingMonthCardProps {
  month: BillingMonth
  onEdit: (month: BillingMonth) => void
  onDelete: (monthId: string) => void
  onAddStudent: (monthId: string) => void
  onEditStudent: (monthId: string, student: StudentHours) => void
  onDeleteStudent: (monthId: string, studentId: string) => void
}

export function BillingMonthCard({
  month,
  onEdit,
  onDelete,
  onAddStudent,
  onEditStudent,
  onDeleteStudent
}: BillingMonthCardProps) {
  const { students: allStudents } = useTutorStudents()
  const totalHours = month.students.reduce((sum, student) => sum + student.hours, 0)

  // Funkcja pomocnicza do znalezienia danych ucznia
  const getStudentData = (studentId: string) => {
    return allStudents.find(s => s.id === studentId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{month.name}</CardTitle>
            <CardDescription>{month.year}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAddStudent(month.id)}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(month)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(month.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {month.students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Brak uczniów w tym miesiącu</p>
            <Button
              variant="link"
              onClick={() => onAddStudent(month.id)}
              className="mt-2"
            >
              Dodaj pierwszego ucznia
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imię</TableHead>
                  <TableHead>Nazwisko</TableHead>
                  <TableHead className="text-right">Godziny</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {month.students.map((student) => {
                  const studentData = getStudentData(student.studentId)
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        {studentData?.first_name || "Nieznany"}
                      </TableCell>
                      <TableCell>
                        {studentData?.last_name || "Uczeń"}
                      </TableCell>
                      <TableCell className="text-right">{student.hours}h</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditStudent(month.id, student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteStudent(month.id, student.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center font-semibold">
                <span>Suma godzin:</span>
                <span className="text-lg">{totalHours}h</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
