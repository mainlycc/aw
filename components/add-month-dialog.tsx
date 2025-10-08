"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BillingMonth } from "@/types/billing"

interface AddMonthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (month: Omit<BillingMonth, "id" | "students">) => void
  editingMonth?: BillingMonth | null
}

const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
]

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i)

export function AddMonthDialog({ open, onOpenChange, onSave, editingMonth }: AddMonthDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState(editingMonth?.name || "")
  const [selectedYear, setSelectedYear] = useState(editingMonth?.year.toString() || new Date().getFullYear().toString())

  const handleSave = () => {
    if (!selectedMonth || !selectedYear) return

    onSave({
      name: selectedMonth,
      year: parseInt(selectedYear)
    })

    // Reset form
    if (!editingMonth) {
      setSelectedMonth("")
      setSelectedYear(new Date().getFullYear().toString())
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingMonth ? "Edytuj miesiąc" : "Dodaj nowy miesiąc"}
          </DialogTitle>
          <DialogDescription>
            {editingMonth 
              ? "Zmień nazwę lub rok miesiąca"
              : "Wybierz miesiąc i rok dla nowego rozliczenia"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="month">Miesiąc</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Wybierz miesiąc" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="year">Rok</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Wybierz rok" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={!selectedMonth || !selectedYear}>
            {editingMonth ? "Zapisz zmiany" : "Dodaj miesiąc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

