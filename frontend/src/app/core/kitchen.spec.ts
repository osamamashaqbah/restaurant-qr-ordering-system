import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { KitchenService } from './kitchen';

describe('KitchenService', () => {
  let service: KitchenService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(KitchenService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads only the staff board endpoint', () => {
    service.getOrders().subscribe();
    const request = controller.expectOne('/api/staff/kitchen/orders');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('uses explicit command endpoints', () => {
    service.markReady('order-1').subscribe();
    const request = controller.expectOne('/api/staff/kitchen/orders/order-1/mark-ready');
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });
});
