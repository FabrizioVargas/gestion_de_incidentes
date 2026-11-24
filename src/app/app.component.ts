import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Incident, IncidentDraft, IncidentStatus, Priority } from './models/incident.model';
import { IncidentService } from './services/incident.service';

registerLocaleData(localeEs);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly query = signal('');
  readonly priorityFilter = signal('Todas');
  readonly statusFilter = signal('Todos');
  readonly currentPage = signal(1);
  readonly pageSize = 5;
  readonly modalOpen = signal(false);
  readonly selected = signal<Incident | null>(null);
  readonly deleteTarget = signal<Incident | null>(null);
  readonly toast = signal('');
  readonly priorities: Priority[] = ['Alta', 'Media', 'Baja'];
  readonly statuses: IncidentStatus[] = ['Pendiente', 'En proceso', 'Resuelta'];
  readonly form;
  readonly Math = Math;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly filtered = computed(() => {
    const term = this.query().trim().toLocaleLowerCase('es');
    return this.service.incidents()
      .filter(item =>
        (!term || `${item.code} ${item.title} ${item.description} ${item.assignee}`.toLocaleLowerCase('es').includes(term)) &&
        (this.priorityFilter() === 'Todas' || item.priority === this.priorityFilter()) &&
        (this.statusFilter() === 'Todos' || item.status === this.statusFilter())
      )
      .sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true }));
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly visibleIncidents = computed(() => this.filtered().slice((this.currentPage() - 1) * this.pageSize, this.currentPage() * this.pageSize));
  readonly firstVisible = computed(() => this.filtered().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1);
  readonly lastVisible = computed(() => Math.min(this.currentPage() * this.pageSize, this.filtered().length));
  readonly stats = computed(() => {
    const all = this.service.incidents();
    return { total: all.length, pending: all.filter(item => item.status === 'Pendiente').length, progress: all.filter(item => item.status === 'En proceso').length, resolved: all.filter(item => item.status === 'Resuelta').length };
  });

  constructor(private readonly service: IncidentService, private readonly fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(70)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(240)]],
      priority: ['Media' as Priority, Validators.required],
      status: ['Pendiente' as IncidentStatus, Validators.required],
      assignee: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
  }

  setQuery(value: string): void { this.query.set(value); this.currentPage.set(1); }
  setPriority(value: string): void { this.priorityFilter.set(value); this.currentPage.set(1); }
  setStatus(value: string): void { this.statusFilter.set(value); this.currentPage.set(1); }
  openCreate(): void { this.selected.set(null); this.form.reset({ title: '', description: '', priority: 'Media', status: 'Pendiente', assignee: '' }); this.modalOpen.set(true); }
  openEdit(incident: Incident): void { this.selected.set(incident); this.form.reset({ title: incident.title, description: incident.description, priority: incident.priority, status: incident.status, assignee: incident.assignee }); this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); this.form.markAsUntouched(); }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const draft: IncidentDraft = this.form.getRawValue();
    if (this.selected()) { this.service.update(this.selected()!.id, draft); this.showToast('Incidencia actualizada'); }
    else { this.service.add(draft); this.currentPage.set(1); this.showToast('Incidencia registrada correctamente'); }
    this.closeModal();
  }

  confirmDelete(incident: Incident): void { this.deleteTarget.set(incident); }
  cancelDelete(): void { this.deleteTarget.set(null); }
  deleteIncident(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.service.remove(target.id);
    if (this.currentPage() > this.pageCount()) this.currentPage.set(this.pageCount());
    this.deleteTarget.set(null);
    this.showToast('Incidencia eliminada');
  }
  changePage(page: number): void { this.currentPage.set(Math.min(this.pageCount(), Math.max(1, page))); }
  trackById(_: number, item: Incident): string { return item.id; }
  initials(name: string): string { return name.split(' ').slice(0, 2).map(part => part.charAt(0)).join(''); }
  private showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3000);
  }
}
