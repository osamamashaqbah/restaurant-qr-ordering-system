import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CashierService } from './cashier';

describe('CashierService', () => {
  let service: CashierService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CashierService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads staff cashier orders', () => {
    service.getOrders().subscribe();
    const request = controller.expectOne('/api/staff/cashier/orders');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('uses the explicit close command', () => {
    service.close('order-1').subscribe();
    const request = controller.expectOne('/api/staff/cashier/orders/order-1/close');
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });

  it('loads cashier availability through the staff endpoint', () => {
    service.getMenu().subscribe();
    const request = controller.expectOne('/api/staff/cashier/menu');
    expect(request.request.method).toBe('GET');
    request.flush({ categories: [], items: [] });
  });

  it('uses the explicit availability command', () => {
    service.setAvailability('item-1', false).subscribe();
    const request = controller.expectOne('/api/staff/cashier/menu/items/item-1/availability');
    expect(request.request.body).toEqual({ isAvailable: false });
    request.flush(null);
  });
});
