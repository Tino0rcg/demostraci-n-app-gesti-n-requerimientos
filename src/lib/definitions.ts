export type User = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    role: 'Usuario' | 'Técnico' | 'Administrador Full' | 'Administrador Cliente';
    empresa: string;
    password?: string;
    phone?: string;
  };
  
export type TicketStatus = 'Ingresado' | 'En proceso' | 'Espera de aprobación' | 'Terminado';
  export type TicketPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
  export type TicketCategory = 'Redes' | 'Software' | 'Hardware' | 'Cuentas' | 'Seguridad' | 'Otro';
  
  export type Ticket = {
    id: string;
    codigo?: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    category: TicketCategory;
    createdAt: Date;
    updatedAt: Date;
    dueAt: Date;
    resolvedAt: Date | null;
    submitterId: string;
    assigneeId: string | null;
  };

  export type Note = {
    id: string;
    ticketId: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }
  