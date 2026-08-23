import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaffAuthService } from '../../core/supabase-auth';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(StaffAuthService);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('error') === 'not_authorized') {
      this.error.set('You do not have access to that page.');
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);
    const error = await this.auth.signIn(this.form.controls.email.value, this.form.controls.password.value);
    if (error) {
      this.error.set(error);
      this.submitting.set(false);
      return;
    }

    const role = this.auth.identity()?.role;
    const requested = this.route.snapshot.queryParamMap.get('next');
    const destination = requested?.startsWith(`/${role}`) ? requested : `/${role}`;
    await this.router.navigateByUrl(destination);
    this.submitting.set(false);
  }
}
