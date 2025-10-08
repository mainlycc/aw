export interface StudentHours {
  id: string
  studentId: string  // ID ucznia z bazy danych
  hours: number
}

export interface BillingMonth {
  id: string
  name: string
  year: number
  students: StudentHours[]
}

