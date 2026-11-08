import { notFound } from 'next/navigation';
import { tickets, users, notes } from '@/lib/data';
import type { User, TicketStatus, TicketPriority, Note } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Circle,
    Clock,
    Tag,
    User as UserIcon,
    Calendar,
    MessageSquare,
} from 'lucide-react';

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

const statusVariant: { [key in TicketStatus]: "default" | "secondary" | "destructive" | "outline" } = {
    Ingresado: "default",
    'En proceso': "secondary",
    'Espera de aprobación': "outline",
    Terminado: "destructive",
}

const priorityVariant: { [key in TicketPriority]: "default" | "secondary" | "destructive" | "outline" } = {
    Baja: "outline",
    Media: "secondary",
    Alta: "default",
    Crítica: "destructive",
}

const getUser = (userId: string | null): User | undefined => users.find(u => u.id === userId);

export default async function TicketDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
        notFound();
    }

    const submitter = getUser(ticket.submitterId);
    const assignee = getUser(ticket.assigneeId);
    const ticketNotes = notes.filter(n => n.ticketId === ticket.id).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                        <CardDescription>
                            Opened by {submitter?.name} {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            <Avatar>
                                <AvatarImage src={assignee?.avatarUrl} />
                                <AvatarFallback>{assignee?.name.charAt(0) ?? 'A'}</AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                                <Textarea placeholder="Add a note or update..." />
                                <div className="mt-2 flex justify-end">
                                    <Button>Add Note</Button>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {ticketNotes.map(note => {
                            const author = getUser(note.authorId);
                            return (
                                <div key={note.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={author?.avatarUrl} />
                                        <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{author?.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(note.createdAt, { addSuffix: true })}</p>
                                        </div>
                                        <div className="p-3 mt-1 bg-muted/50 rounded-lg">
                                            <p className="text-sm">{note.content}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Circle className="w-4 h-4"/> Status</span>
                            <Select defaultValue={ticket.status}>
                                <SelectTrigger className="w-[180px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Tag className="w-4 h-4" /> Priority</span>
                            <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><UserIcon className="w-4 h-4" /> Assignee</span>
                             <Select defaultValue={assignee?.id ?? "unassigned"}>
                                <SelectTrigger className="w-[180px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {users.filter(u => u.role !== 'Usuario').map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Created</span>
                            <span>{format(ticket.createdAt, 'PPp')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Last Updated</span>
                            <span>{format(ticket.updatedAt, 'PPp')}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
