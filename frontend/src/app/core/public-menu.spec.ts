import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicMenuService } from './public-menu';

describe('PublicMenu', () => {
  let service: PublicMenuService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicMenuService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the menu through the ASP.NET API', () => {
    service.get().subscribe();
    const request = http.expectOne('/api/public/menu');
    expect(request.request.method).toBe('GET');
    request.flush({ categories: [], items: [] });
  });

  it('is provided by the root injector', () => {
    expect(service).toBeTruthy();
  });
});
