import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrderTrackingService } from './order-tracking';

describe('OrderTracking', () => {
  let service: OrderTrackingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderTrackingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests tracking through the ASP.NET API', () => {
    service.get('a'.repeat(43)).subscribe();

    const request = http.expectOne('/api/public/orders/' + 'a'.repeat(43) + '/tracking');
    expect(request.request.method).toBe('GET');
    request.flush({
      status: 'ready',
      total: 1,
      createdAt: '',
      updatedAt: '',
      closedAt: null,
      items: [],
    });
  });

  it('is provided by the root injector', () => {
    expect(service).toBeTruthy();
  });
});
