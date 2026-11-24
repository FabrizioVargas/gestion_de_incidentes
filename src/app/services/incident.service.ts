import { Injectable, signal } from '@angular/core';
import { Incident, IncidentDraft } from '../models/incident.model';

const STORAGE_KEY = 'nexo-incidents-v1';
const SEED: Incident[] = [
  { id: '1', code: 'INC-001', title: 'Falla de red Lab 04', description: 'Sin conectividad en las estaciones de trabajo del laboratorio.', priority: 'Alta', status: 'En proceso', date: '2026-11-23', assignee: 'Carlos Mendoza' },
  { id: '2', code: 'INC-002', title: 'Error acceso portal', description: 'El portal institucional rechaza las credenciales de acceso.', priority: 'Media', status: 'Pendiente', date: '2026-11-23', assignee: 'Ana Torres' },
  { id: '3', code: 'INC-003', title: 'Actualización Office', description: 'Solicitar actualización del paquete de ofimática.', priority: 'Baja', status: 'Resuelta', date: '2026-11-22', assignee: 'Luis Ramírez' },
  { id: '4', code: 'INC-004', title: 'Impresora sin conexión', description: 'Impresora de administración no aparece en la red.', priority: 'Media', status: 'Pendiente', date: '2026-11-21', assignee: 'María López' },
  { id: '5', code: 'INC-005', title: 'Acceso a carpeta compartida', description: 'Permisos de lectura para nuevos integrantes del área.', priority: 'Baja', status: 'En proceso', date: '2026-11-20', assignee: 'Carlos Mendoza' }
];

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly storage = this.readStorage();
  readonly incidents = signal<Incident[]>(this.storage);

  add(draft: IncidentDraft): Incident {
    const nextNumber = this.incidents().reduce((max, item) => Math.max(max, Number(item.code.split('-')[1]) || 0), 0) + 1;
    const incident: Incident = {
      ...draft,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      code: `INC-${String(nextNumber).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10)
    };
    this.save([incident, ...this.incidents()]);
    return incident;
  }

  update(id: string, draft: IncidentDraft): void {
    this.save(this.incidents().map(item => item.id === id ? { ...item, ...draft } : item));
  }

  remove(id: string): void {
    this.save(this.incidents().filter(item => item.id !== id));
  }

  private readStorage(): Incident[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed as Incident[];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    } catch {
      return [...SEED];
    }
    return [...SEED];
  }

  private save(incidents: Incident[]): void {
    this.incidents.set(incidents);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents)); } catch { /* The current session still works without storage. */ }
  }
}
