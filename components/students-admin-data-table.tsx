"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { IconChevronDown, IconUsers, IconTrash } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StudentDetailsDialog } from "@/components/student-details-dialog"
import { EditStudentSimpleDialog } from "@/components/edit-student-simple-dialog"

interface StudentData {
  enrollmentId: string | null
  studentId: string
  imieNazwisko: string
  active: boolean
  poziom: string
  poziomRaw: string
  przedmioty: string
  dataUtworzenia: string
}

interface StudentsAdminDataTableProps {
  data: StudentData[]
}

const getColumns = (
  onStudentClick: (student: StudentData) => void
): ColumnDef<StudentData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Zaznacz wszystkie"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Zaznacz wiersz"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "imieNazwisko",
    header: "Imię i Nazwisko",
    cell: ({ row }) => (
      <button
        onClick={() => onStudentClick(row.original)}
        className="font-medium text-foreground hover:underline cursor-pointer text-left"
      >
        {row.getValue("imieNazwisko")}
      </button>
    ),
  },
  {
    accessorKey: "przedmioty",
    header: "Przedmioty",
    cell: ({ row }) => {
      const przedmioty = row.getValue("przedmioty") as string
      return przedmioty && przedmioty !== '—' ? (
        <div className="flex flex-wrap gap-1">
          {przedmioty.split(", ").map((przedmiot, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {przedmiot}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "poziom",
    header: "Poziom",
    cell: ({ row }) => {
      const poziomRaw = row.original.poziomRaw
      const poziom = row.getValue("poziom") as string
      
      if (poziom === '—') {
        return <span className="text-sm text-muted-foreground">—</span>
      }
      
      return (
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{
            backgroundColor: poziomRaw === 'advanced' ? '#fee2e2' : 
                           poziomRaw === 'intermediate' ? '#fed7aa' : 
                           poziomRaw === 'expert' ? '#ddd6fe' : '#dcfce7',
            color: poziomRaw === 'advanced' ? '#dc2626' : 
                   poziomRaw === 'intermediate' ? '#ea580c' : 
                   poziomRaw === 'expert' ? '#7c3aed' : '#16a34a'
          }}
        >
          {poziom}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dataUtworzenia",
    header: "Data Utworzenia",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dataUtworzenia"))
      return <div className="text-sm">{date.toLocaleDateString('pl-PL')}</div>
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean
      
      return (
        <Badge variant={active ? "default" : "secondary"} className="text-xs">
          {active ? "Aktywny" : "Nieaktywny"}
        </Badge>
      )
    },
  },
]

export function StudentsAdminDataTable({ data }: StudentsAdminDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [simpleEditDialogOpen, setSimpleEditDialogOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleStudentClick = (student: StudentData) => {
    if (student.enrollmentId) {
      // Uczeń ma zapisy - otwórz pełny dialog ze szczegółami
      setSelectedEnrollmentId(student.enrollmentId)
      setDetailsDialogOpen(true)
    } else {
      // Uczeń bez zapisów - otwórz prosty dialog edycji
      setSelectedStudentId(student.studentId)
      setSimpleEditDialogOpen(true)
    }
  }

  const columns = React.useMemo(() => getColumns(handleStudentClick), [])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    
    if (selectedRows.length === 0) {
      toast.error("Nie zaznaczono żadnych uczniów")
      return
    }

    // Potwierdź usunięcie
    if (!confirm(`Czy na pewno chcesz usunąć ${selectedRows.length} zaznaczonych uczniów?`)) {
      return
    }

    setIsDeleting(true)

    try {
      // Pobierz ID uczniów do usunięcia
      const studentIds = selectedRows.map(row => row.original.studentId)

      console.log('Usuwanie uczniów:', studentIds)

      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', studentIds)

      if (error) {
        console.error('Błąd podczas usuwania:', error)
        throw error
      }

      toast.success("Uczniowie zostali usunięci", {
        description: `Usunięto ${selectedRows.length} uczniów`
      })

      // Wyczyść zaznaczenie
      setRowSelection({})
      
      // Odśwież stronę
      router.refresh()
    } catch (error: any) {
      console.error('Błąd:', error)
      toast.error("Nie udało się usunąć uczniów", {
        description: error.message || "Sprawdź uprawnienia w Supabase"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Filtry i opcje */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Szukaj uczniów..."
            value={(table.getColumn("imieNazwisko")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("imieNazwisko")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <Select
            value={(table.getColumn("active")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn("active")?.setFilterValue(undefined)
              } else {
                table.getColumn("active")?.setFilterValue(value === "true")
              }
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="true">Aktywny</SelectItem>
              <SelectItem value="false">Nieaktywny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {selectedRowsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              <IconTrash className="h-4 w-4" />
              Usuń ({selectedRowsCount})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                Kolumny <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <IconUsers className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Brak uczniów
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} z{" "}
          {table.getFilteredRowModel().rows.length} uczniów wybranych
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Poprzednia
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Następna
          </Button>
        </div>
      </div>

      {/* Dialog ze szczegółami ucznia (dla uczniów z zapisami) */}
      {selectedEnrollmentId && (
        <StudentDetailsDialog 
          enrollmentId={selectedEnrollmentId}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}

      {/* Prosty dialog edycji (dla uczniów bez zapisów) */}
      {selectedStudentId && (
        <EditStudentSimpleDialog 
          studentId={selectedStudentId}
          open={simpleEditDialogOpen}
          onOpenChange={setSimpleEditDialogOpen}
        />
      )}
    </div>
  )
}

