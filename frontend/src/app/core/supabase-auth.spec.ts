import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { signal } from '@angular/core';
import { SUPABASE_CLIENT, StaffAuthService, StaffIdentity } from './supabase-auth';
import { staffAuthInterceptor } from './staff-auth-interceptor';

describe('StaffAuthService', () => {
  let service: StaffAuthService;
  let controller: HttpTestingController;
  let session: Session | null;
  let signOut: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    session = null;
    signOut = vi.fn(async () => {
      session = null;
      return { error: null };
    });
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session }, error: null })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signInWithPassword: vi.fn(async () => {
          session = { access_token: 'access-token', refresh_token: 'refresh-token' } as Session;
          return { data: { session, user: null }, error: null };
        }),
        signOut,
      },
    } as unknown as SupabaseClient;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([staffAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: SUPABASE_CLIENT, useValue: client },
      ],
    });
    service = TestBed.inject(StaffAuthService);
    controller = TestBed.inject(HttpTestingController);
    await service.ready();
  });

  afterEach(() => controller.verify());

  it('loads the role from the API after a successful Supabase login', async () => {
    const resultPromise = service.signIn(' chef@example.com ', 'secret');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const request = controller.expectOne('/api/staff/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({ role: 'kitchen', fullName: 'Chef' });

    expect(await resultPromise).toBeNull();
    expect(service.identity()).toEqual({ role: 'kitchen', fullName: 'Chef' });
  });

  it('signs out accounts that have no assigned role', async () => {
    const resultPromise = service.signIn('pending@example.com', 'secret');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    controller.expectOne('/api/staff/me').flush({ error: 'forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(await resultPromise).toBe('Your account does not have an assigned staff role.');
    expect(signOut).toHaveBeenCalledOnce();
    expect(service.session()).toBeNull();
  });

  it('returns a generic error for invalid credentials', async () => {
    const client = TestBed.inject(SUPABASE_CLIENT) as unknown as { auth: { signInWithPassword: ReturnType<typeof vi.fn> } };
    client.auth.signInWithPassword.mockResolvedValueOnce({ data: { session: null }, error: new Error('wrong password') });

    expect(await service.signIn('chef@example.com', 'wrong')).toBe('Invalid email or password.');
    expect(service.identity()).toBeNull();
  });
});
