import { TestBed } from '@angular/core/testing';
import { CartService } from './cart';

describe('Cart', () => {
  let service: CartService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('caps quantity at 50 and recalculates totals', () => {
    const item = {
      id: 'item-1', categoryId: 'category-1', nameEn: 'Hummus', nameAr: 'حمص', descriptionEn: '', descriptionAr: '',
      price: 3.5, imageUrl: null, allergens: [], isAvailable: true,
    };
    service.add(item);
    service.updateQuantity('item-1', 99);

    expect(service.items()[0].quantity).toBe(50);
    expect(service.total()).toBe(175);
  });

  it('trims notes at the server limit and persists them', () => {
    const item = {
      id: 'item-1', categoryId: 'category-1', nameEn: 'Hummus', nameAr: 'حمص', descriptionEn: '', descriptionAr: '',
      price: 3.5, imageUrl: null, allergens: [], isAvailable: true,
    };
    service.add(item);
    service.updateNotes('item-1', 'x'.repeat(301));

    expect(service.items()[0].notes).toHaveLength(300);
    expect(JSON.parse(sessionStorage.getItem('cart_items')!)[0].notes).toHaveLength(300);
  });

  it('is provided by the root injector', () => {
    expect(service).toBeTruthy();
  });
});
