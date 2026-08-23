import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { staffAuthInterceptor } from './staff-auth-interceptor';
import { SUPABASE_CLIENT } from './supabase-auth';

describe('staffAuthInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let getSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSession = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([staffAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: SUPABASE_CLIENT, useValue: { auth: { getSession } } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the current access token to API requests', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });
    const request = firstValueFrom(http.get('/api/staff/me'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const pending = controller.expectOne('/api/staff/me');

    expect(pending.request.headers.get('Authorization')).toBe('Bearer token-123');
    pending.flush({ role: 'kitchen', fullName: 'Chef' });
    await request;
  });

  it('leaves requests unchanged when no session exists', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    const request = firstValueFrom(http.get('/api/public/menu'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const pending = controller.expectOne('/api/public/menu');

    expect(pending.request.headers.has('Authorization')).toBe(false);
    pending.flush({ categories: [], items: [] });
    await request;
  });
});
