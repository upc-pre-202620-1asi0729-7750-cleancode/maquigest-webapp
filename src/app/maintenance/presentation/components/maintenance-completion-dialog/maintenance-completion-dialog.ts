import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

export interface MaintenanceCompletionResult {
  technician: string;
  notes: string;
}

@Component({
  selector: 'app-maintenance-completion-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'maintenance.advance.dialog-title' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'maintenance.advance.dialog-description' | translate }}</p>
      <p><strong>{{ data.equipmentName }}</strong> — {{ data.type }}</p>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 12px">
        <mat-label>{{ 'maintenance.advance.technician' | translate }}</mat-label>
        <input matInput name="technician" [(ngModel)]="technician" maxlength="180" required />
      </mat-form-field>
      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>{{ 'maintenance.advance.notes' | translate }}</mat-label>
        <textarea matInput name="notes" [(ngModel)]="notes" maxlength="1000" rows="3"></textarea>
      </mat-form-field>
      <mat-checkbox name="confirmed" [(ngModel)]="confirmed">
        {{ 'maintenance.advance.confirm-performed' | translate }}
      </mat-checkbox>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">
        {{ 'maintenance.advance.cancel' | translate }}
      </button>
      <button mat-flat-button type="button" [disabled]="!confirmed || !technician.trim()" (click)="complete()">
        {{ 'maintenance.advance.submit' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceCompletionDialog {
  protected readonly data = inject<{ equipmentName: string; type: string }>(MAT_DIALOG_DATA);
  readonly #dialogRef = inject<MatDialogRef<MaintenanceCompletionDialog, MaintenanceCompletionResult>>(MatDialogRef);

  protected technician = '';
  protected notes = '';
  protected confirmed = false;

  protected complete(): void {
    if (!this.confirmed || !this.technician.trim()) return;
    this.#dialogRef.close({ technician: this.technician.trim(), notes: this.notes.trim() });
  }

  protected cancel(): void {
    this.#dialogRef.close();
  }
}
