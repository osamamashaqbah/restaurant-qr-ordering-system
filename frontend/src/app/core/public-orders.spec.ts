import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicOrdersService } from './public-orders';

describe('PublicOrders', () => {
  let service: PublicOrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicOrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates orders through the ASP.NET API', () => {
    service.create({ customerName: 'Sara', customerWhatsapp: '962791234567', tableNumber: '7', items: [] }).subscribe();

    const request = http.expectOne('/api/public/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).not.toHaveProperty('total');
    request.flush({ trackingToken: 'a'.repeat(43) });
  });

  it('is provided by the root injector', () => {
    expect(service).toBeTruthy();
  });
});
