import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { StaffAuthService } from './supabase-auth';
import { staffRoleGuard } from './staff-role.guard';

describe('staffRoleGuard', () => {
  const state = { url: '/kitchen' } as RouterStateSnapshot;

  it('redirects anonymous users with the original destination', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StaffAuthService, useValue: { ready: async () => {}, session: signal(null), identity: signal(null) } },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => staffRoleGuard('kitchen')(undefined!, state));

    expect(result?.toString()).toContain('/login?next=%2Fkitchen');
  });

  it('allows only the requested role', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: StaffAuthService,
          useValue: {
            ready: async () => {},
            session: signal({}),
            identity: signal({ role: 'cashier', fullName: 'Cashier' }),
            refreshIdentity: async () => ({ role: 'cashier', fullName: 'Cashier' }),
          },
        },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => staffRoleGuard('kitchen')(undefined!, state));

    expect(result?.toString()).toContain('/login?error=not_authorized');
  });
});
