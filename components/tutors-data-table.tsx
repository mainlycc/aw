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

interface TutorData {
  id: string
  imieNazwisko: string
  email: string | null
  phone: string | null
  rate: number | null
  active: boolean
  przedmioty: string
}

interface TutorsDataTableProps {
  data: TutorData[]
}

const getColumns = (
  onTutorClick: (tutorId: string) => void
): ColumnDef<TutorData>[] => [
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
        onClick={() => onTutorClick(row.original.id)}
        className="font-medium text-foreground hover:underline cursor-pointer text-left"
      >
        {row.getValue("imieNazwisko")}
      </button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return (
        <div className="text-sm text-muted-foreground">
          {email || "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Telefon",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return (
        <div className="text-sm text-muted-foreground">
          {phone || "—"}
        </div>
      )
    },
  },
  {
    accessorKey: "przedmioty",
    header: "Przedmioty",
    cell: ({ row }) => {
      const przedmioty = row.getValue("przedmioty") as string
      return przedmioty ? (
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
    accessorKey: "rate",
    header: "Stawka",
    cell: ({ row }) => {
      const rate = row.getValue("rate") as number | null
      return (
        <div className="text-sm">
          {rate ? `${rate} zł/h` : "—"}
        </div>
      )
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

export function TutorsDataTable({ data }: TutorsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleTutorClick = (tutorId: string) => {
    router.push(`/admin/korepetytorzy/${tutorId}`)
  }

  const columns = React.useMemo(() => getColumns(handleTutorClick), [])

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
      toast.error("Nie zaznaczono żadnych korepetytorów")
      return
    }

    // Potwierdź usunięcie
    if (!confirm(`Czy na pewno chcesz usunąć ${selectedRows.length} zaznaczonych korepetytorów?`)) {
      return
    }

    setIsDeleting(true)

    try {
      // Pobierz ID tutorów do usunięcia
      const tutorIds = selectedRows.map(row => row.original.id)

      console.log('Usuwanie korepetytorów:', tutorIds)

      const { error } = await supabase
        .from('tutors')
        .delete()
        .in('id', tutorIds)

      if (error) {
        console.error('Błąd podczas usuwania:', error)
        throw error
      }

      toast.success("Korepetytorzy zostali usunięci", {
        description: `Usunięto ${selectedRows.length} korepetytorów`
      })

      // Wyczyść zaznaczenie
      setRowSelection({})
      
      // Odśwież stronę
      router.refresh()
    } catch (error: any) {
      console.error('Błąd:', error)
      toast.error("Nie udało się usunąć korepetytorów", {
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
            placeholder="Szukaj korepetytorów..."
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
                      Brak korepetytorów
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
          {table.getFilteredRowModel().rows.length} korepetytorów wybranych
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

    </div>
  )
}

