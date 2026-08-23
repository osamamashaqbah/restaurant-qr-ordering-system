import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerSessionService } from '../../core/customer-session';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-entry',
  styleUrl: './entry.scss',
  templateUrl: './entry.html',
})
export class Entry {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly session = inject(CustomerSessionService);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    countryCode: ['962', [Validators.required, Validators.pattern(/^[0-9]{1,4}$/)]],
    whatsappLocal: ['', [Validators.required, Validators.pattern(/^0?[0-9]{6,12}$/)]],
    tableNumber: ['', [Validators.required, Validators.maxLength(20)]],
  });

  submit() {
    const value = this.form.getRawValue();
    const whatsapp = `${value.countryCode}${value.whatsappLocal.replace(/^0+/, '')}`;
    if (!/^[0-9]{7,15}$/.test(whatsapp)) {
      this.form.controls.whatsappLocal.setErrors({ whatsappInvalid: true });
      this.form.controls.whatsappLocal.markAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.session.set({ name: value.name.trim(), whatsapp, tableNumber: value.tableNumber.trim() });
    void this.router.navigateByUrl('/menu');
  }
}
