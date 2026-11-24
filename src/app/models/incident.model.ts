export type Priority = 'Alta' | 'Media' | 'Baja';
export type IncidentStatus = 'Pendiente' | 'En proceso' | 'Resuelta';

export interface Incident {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: Priority;
  status: IncidentStatus;
  date: string;
  assignee: string;
}

export type IncidentDraft = Omit<Incident, 'id' | 'code' | 'date'>;
