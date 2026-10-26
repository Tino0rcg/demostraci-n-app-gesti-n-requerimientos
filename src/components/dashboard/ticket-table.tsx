"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from 'date-fns';
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TicketDetailsInfo } from "@/components/dashboard/ticket-details-info";
import { getSlaStatus } from "@/lib/sla-utils";
import type { Ticket, User, TicketStatus, TicketPriority } from "@/lib/definitions";

const statusVariant: { [key in TicketStatus]: "default" | "secondary" | "destructive" | "outline" } = {
    'Ingresado': "default",
    'En proceso': "secondary",
    'Espera de aprobación': "outline",
    'Terminado': "outline",
}

const statusColorMap: { [key in TicketStatus]: string } = {
    'Ingresado': "bg-blue-500/10 text-blue-400 border-blue-500/20",
    'En proceso': "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    'Espera de aprobación': "bg-purple-500/10 text-purple-400 border-purple-500/20",
    'Terminado': "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

const priorityColorMap: { [key in string]: string } = {
    Baja: "bg-green-500/20 text-green-400 border border-green-500/30",
    Media: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    Alta: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    Crítica: "bg-red-500/20 text-red-400 border border-red-500/30",
}

export function TicketTable({ tickets, allUsers }: { tickets: Ticket[], allUsers: User[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const getAssignee = (assigneeId: string | null): User | undefined => allUsers?.find(u => u.id === assigneeId);
  const getSubmitter = (submitterId: string): User | undefined => allUsers?.find(u => u.id === submitterId);

  const columns: ColumnDef<Ticket>[] = React.useMemo(() => [
    {
      accessorKey: "id",
      header: () => <span className="hidden md:inline">Ticket ID</span>,
      cell: ({ row }) => <Link href={`/dashboard/tickets`} className="hover:underline font-mono text-xs hidden md:inline">{row.getValue("id")}</Link>,
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Subject <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="capitalize font-medium">{row.getValue("subject")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const status = row.getValue("status") as TicketStatus;
          const ticket = row.original;
          const sla = getSlaStatus(ticket);
          return (
              <div className="flex items-center gap-2">
                  <div title={sla.label} className={`h-2.5 w-2.5 rounded-full ${sla.color}`} />
                  <Badge variant={statusVariant[status]}>{status}</Badge>
              </div>
          )
      },
    },
    {
      accessorKey: "submitterId",
      header: "Solicitante / Empresa",
      cell: ({ row }) => {
          const submitter = getSubmitter(row.getValue("submitterId"));
          if (!submitter) return <span className="text-muted-foreground italic text-xs">Externo</span>;
  
          return (
              <div className="flex flex-col">
                  <span className="font-bold text-white text-sm leading-tight mb-0.5">{submitter.name}</span>
                  <span className="text-[10px] text-blue-400 uppercase font-black tracking-wider opacity-90">{submitter.empresa}</span>
              </div>
          )
      },
    },
    {
      accessorKey: "priority",
      header: <span className="hidden lg:table-cell">Priority</span>,
      cell: ({ row }) => {
          const priority = row.getValue("priority") as TicketPriority;
          return <Badge variant="outline" className={`hidden lg:inline-flex ${priorityColorMap[priority]}`}>{priority}</Badge>
      },
    },
    {
      accessorKey: "assigneeId",
      header: <span className="hidden sm:table-cell">Assignee</span>,
      cell: ({ row }) => {
          const assignee = getAssignee(row.getValue("assigneeId"));
          if (!assignee) return <span className="text-muted-foreground hidden sm:inline">Unassigned</span>;
  
          return (
              <div className="hidden sm:flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-white/10">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400 text-[10px]">
                          {assignee.name.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{assignee.name}</span>
              </div>
          )
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button variant="ghost" className="hidden lg:flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Last Updated <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-xs text-muted-foreground hidden lg:block">{format(row.getValue("updatedAt"), "PPp")}</div>,
    },
  ], [allUsers]);

  const table = useReactTable({
    data: tickets || [],
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
    initialState: {
        pagination: {
            pageSize: 5,
        }
    }
  });

  const selectedTicket = React.useMemo(() => 
    tickets?.find(t => t.id === selectedId) || null
  , [selectedId, tickets]);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center py-4 gap-3">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
            placeholder="Buscar tickets..."
            value={(table.getColumn("subject")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("subject")?.setFilterValue(event.target.value)
            }
            className="pl-10 glass-card bg-black/20 border-white/10 w-full"
            />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button id="columns-dropdown-trigger" variant="outline" className="hidden sm:flex glass-card bg-black/20 border-white/10">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Card List View (< md: Phones & Small Tablets) */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const ticket = row.original;
            const submitter = getSubmitter(ticket.submitterId);
            const assignee = getAssignee(ticket.assigneeId);
            const sla = getSlaStatus(ticket);

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedId(ticket.id)}
                className="glass-card bg-black/40 border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.98] hover:border-primary/40 cursor-pointer shadow-md space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-primary">
                      #{ticket.codigo || ticket.id.substring(0, 8).toUpperCase()}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${priorityColorMap[ticket.priority]}`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusColorMap[ticket.status]}`}>
                    {ticket.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                    {ticket.subject}
                  </h4>
                  {ticket.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {ticket.description.replace(/\[ADJUNTO_IMAGEN\]:.*/g, '').trim()}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${sla.color}`} />
                    <span className="font-medium text-[10px] uppercase tracking-wider">{sla.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {ticket.resolvedAt 
                        ? `Cerrado ${format(ticket.resolvedAt, "dd/MM")}`
                        : `Vence ${format(ticket.dueAt, "dd/MM")}`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-white/10">
                      <AvatarImage src={submitter?.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {(submitter?.name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[130px]">
                      {submitter?.name || "Cliente"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-[10px] text-zinc-500">
                      {assignee ? assignee.name.split(' ')[0] : 'Sin asignar'}
                    </span>
                    {assignee && (
                      <Avatar className="h-5 w-5 border border-white/10">
                        <AvatarImage src={assignee.avatarUrl} />
                        <AvatarFallback className="text-[9px] bg-blue-500/20 text-blue-400">
                          {assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs">
            No se encontraron tickets.
          </div>
        )}
      </div>

      {/* Desktop Table View (md+) */}
      <div className="hidden md:block rounded-md border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden text-white">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-zinc-400 font-bold py-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
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
                  onClick={() => setSelectedId(row.original.id)}
                  className="cursor-pointer hover:bg-white/5 transition-all border-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                  No se encontraron tickets.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-zinc-500">
          Mostrando {table.getRowModel().rows.length} de {tickets?.length || 0} tickets.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="glass-card bg-black/20 border-white/10"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="glass-card bg-black/20 border-white/10"
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Detalles del Ticket Side Panel */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full max-w-none sm:max-w-md md:max-w-lg lg:max-w-xl glass-panel border-l-primary/20 p-3 sm:p-6 overflow-hidden flex flex-col">
              <SheetTitle className="sr-only">Detalles del Requerimiento</SheetTitle>
              {selectedId && (
                  <TicketDetailsInfo ticketId={selectedId} />
              )}
          </SheetContent>
      </Sheet>
    </div>
  );
}
