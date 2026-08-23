import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AdminMenuService, CategoryInput, MenuItemInput } from '../../core/admin-menu';
import { PublicMenuItem, PublicMenuResponse } from '../../core/public-menu';

@Component({
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  selector: 'app-admin-menu',
  styleUrl: './admin-menu.scss',
  templateUrl: './admin-menu.html',
})
export class AdminMenu {
  private readonly service = inject(AdminMenuService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly menu = signal<PublicMenuResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly editingCategoryId = signal<string | null>(null);
  readonly editingItemId = signal<string | null>(null);

  readonly categoryForm = this.formBuilder.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    sortOrder: [0],
  });
  readonly itemForm = this.formBuilder.nonNullable.group({
    categoryId: ['', Validators.required],
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    isAvailable: [true],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.service.get().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (menu) => {
        this.menu.set(menu);
        this.state.set('ready');
      },
      error: () => {
        this.state.set('error');
        this.error.set('Could not load the menu.');
      },
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid || this.busyId()) return;
    const input: CategoryInput = this.categoryForm.getRawValue();
    const id = this.editingCategoryId();
    this.busyId.set(id ?? 'new-category');
    const request: Observable<unknown> = id ? this.service.updateCategory(id, input) : this.service.createCategory(input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.cancelCategoryEdit();
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Could not save the category.');
      },
    });
  }

  editCategory(category: { id: string; nameEn: string; nameAr: string; sortOrder: number }): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.setValue({ nameEn: category.nameEn, nameAr: category.nameAr, sortOrder: category.sortOrder });
  }

  cancelCategoryEdit(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ nameEn: '', nameAr: '', sortOrder: 0 });
  }

  deleteCategory(id: string): void {
    if (!window.confirm('Delete this category? Items must be moved first.')) return;
    this.runDelete(id, this.service.deleteCategory(id), 'Could not delete the category.');
  }

  saveItem(): void {
    if (this.itemForm.invalid || this.busyId()) return;
    const value = this.itemForm.getRawValue();
    const input: MenuItemInput = { ...value, descriptionEn: '', descriptionAr: '', imageUrl: null, allergens: [] };
    const id = this.editingItemId();
    this.busyId.set(id ?? 'new-item');
    const request: Observable<unknown> = id ? this.service.updateItem(id, input) : this.service.createItem(input);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.cancelItemEdit();
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Could not save the menu item.');
      },
    });
  }

  editItem(item: PublicMenuItem): void {
    this.editingItemId.set(item.id);
    this.itemForm.setValue({ categoryId: item.categoryId, nameEn: item.nameEn, nameAr: item.nameAr, price: item.price, isAvailable: item.isAvailable });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
    this.itemForm.reset({ categoryId: '', nameEn: '', nameAr: '', price: 0, isAvailable: true });
  }

  deleteItem(id: string): void {
    if (!window.confirm('Delete this menu item?')) return;
    this.runDelete(id, this.service.deleteItem(id), 'Could not delete the menu item.');
  }

  private runDelete(id: string, request: ReturnType<AdminMenuService['deleteItem']>, message: string): void {
    this.busyId.set(id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set(message);
      },
    });
  }
}
