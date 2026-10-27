import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Ticket, Note } from '@/lib/definitions';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, color: '#333' },
  header: { borderBottom: '1px solid #e4e4e7', paddingBottom: 15, marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'black', color: '#09090b', marginBottom: 5 },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  badge: { padding: '4px 8px', backgroundColor: '#f4f4f5', borderRadius: 4, fontSize: 10, color: '#3f3f46' },
  detailsContainer: { marginBottom: 25 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 120, color: '#71717a', fontSize: 10, textTransform: 'uppercase' },
  value: { flex: 1, fontWeight: 'heavy', color: '#09090b' },
  descBox: { marginTop: 10, padding: 15, backgroundColor: '#fafafa', borderLeft: '3px solid #09090b' },
  descText: { lineHeight: 1.5, color: '#3f3f46' },
  sectionTitle: { fontSize: 14, marginTop: 20, marginBottom: 15, color: '#09090b', borderBottom: '1px solid #f4f4f5', paddingBottom: 5 },
  messageContainer: { marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #e4e4e7' },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  msgAuthor: { fontWeight: 'heavy', color: '#18181b', fontSize: 10 },
  msgTime: { color: '#a1a1aa', fontSize: 9 },
  msgContent: { lineHeight: 1.4, color: '#3f3f46' },
});

interface TicketPDFProps {
  ticket: Ticket;
  notes: Note[];
  submitterName: string;
  assigneeName: string;
}

export const TicketPDF = ({ ticket, notes, submitterName, assigneeName }: TicketPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{ticket.subject}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>#{ticket.codigo || ticket.id.substring(0,8).toUpperCase()}</Text>
            <Text style={styles.badge}>{ticket.status}</Text>
            <Text style={styles.badge}>{ticket.priority}</Text>
            <Text style={styles.badge}>{ticket.category}</Text>
          </View>
        </View>

        {/* Detalles Centrales */}
        <View style={styles.detailsContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Solicitante:</Text>
            <Text style={styles.value}>{submitterName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Técnico Asignado:</Text>
            <Text style={styles.value}>{assigneeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Creación:</Text>
            <Text style={styles.value}>{format(ticket.createdAt, "dd/MM/yyyy HH:mm")}</Text>
          </View>
          {ticket.resolvedAt && (
             <View style={styles.row}>
                <Text style={styles.label}>Fecha Resolución:</Text>
                <Text style={styles.value}>{format(ticket.resolvedAt, "dd/MM/yyyy HH:mm")}</Text>
             </View>
          )}

          <View style={styles.descBox}>
            <Text style={styles.descText}>{ticket.description}</Text>
          </View>
        </View>

        {/* Historial Operativo (Bitácora) */}
        <Text style={styles.sectionTitle}>Bitácora de Actividades e Intercomunicador</Text>
        
        {notes.length === 0 ? (
          <Text style={{ fontSize: 10, color: '#a1a1aa', fontStyle: 'italic' }}>Sin actividades registradas.</Text>
        ) : (
          notes.map((n, i) => {
            const isSystem = n.content.trim().startsWith('[SISTEMA]');
            const cleanContent = isSystem ? n.content.replace('[SISTEMA]', '').trim() : n.content;
            const esTech = n.authorId === ticket.assigneeId;
            const authorName = isSystem
              ? 'Sistema Automático'
              : (n.authorId === ticket.submitterId ? `${submitterName} (Solicitante)` : (esTech ? `${assigneeName} (Técnico)` : 'Soporte'));

            return (
              <View key={i} style={{ ...styles.messageContainer, backgroundColor: isSystem ? '#fafafa' : (esTech ? '#f0f9ff' : 'transparent'), padding: (isSystem || esTech) ? 8 : 4, borderRadius: 4 }}>
                <View style={styles.msgHeader}>
                  <Text style={{ ...styles.msgAuthor, color: isSystem ? '#64748b' : (esTech ? '#0284c7' : '#18181b') }}>{authorName}</Text>
                  <Text style={styles.msgTime}>{format(n.createdAt, "dd/MM/yyyy HH:mm")}</Text>
                </View>
                <Text style={styles.msgContent}>{cleanContent}</Text>
              </View>
            )
          })
        )}
      </Page>
    </Document>
  );
};
