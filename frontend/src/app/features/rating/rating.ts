import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicRatingService } from '../../core/rating';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-rating',
  styleUrl: './rating.scss',
  templateUrl: './rating.html',
})
export class Rating {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PublicRatingService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly trackingToken = this.route.snapshot.paramMap.get('trackingToken') ?? '';
  readonly stars = signal(0);
  readonly state = signal<'form' | 'submitting' | 'success' | 'not-found' | 'already-rated' | 'error'>('form');
  readonly form = this.formBuilder.nonNullable.group({
    comment: ['', Validators.maxLength(500)],
  });

  setStars(value: number): void {
    if (value >= 1 && value <= 5) this.stars.set(value);
  }

  submit(): void {
    if (!this.trackingToken || this.stars() === 0 || this.form.invalid || this.state() === 'submitting') return;

    this.state.set('submitting');
    this.service.submit(this.trackingToken, this.stars(), this.form.controls.comment.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.state.set('success'),
        error: (error: HttpErrorResponse) => {
          this.state.set(error.status === 404 ? 'not-found' : error.status === 409 ? 'already-rated' : 'error');
        },
      });
  }
}
