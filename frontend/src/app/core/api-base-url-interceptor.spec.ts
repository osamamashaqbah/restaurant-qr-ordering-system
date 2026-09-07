import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, apiBaseUrlInterceptor } from './api-base-url-interceptor';

describe('apiBaseUrlInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiBaseUrlInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.com/' },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('prefixes same-app API requests with the production API origin', () => {
    http.get('/api/health').subscribe();
    controller.expectOne('https://api.example.com/api/health').flush({ status: 'ok' });
  });

  it('leaves external requests unchanged', () => {
    http.get('https://example.com/data').subscribe();
    controller.expectOne('https://example.com/data').flush({});
  });
});
