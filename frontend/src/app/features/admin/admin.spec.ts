import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AdminService } from '../../core/admin';
import { StaffAuthService } from '../../core/supabase-auth';
import { Admin } from './admin';

describe('Admin', () => {
  let fixture: ComponentFixture<Admin>;
  let updateRole: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    updateRole = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [
        { provide: AdminService, useValue: { getStaff: () => of([{ id: 'staff-1', email: 'chef@example.com', fullName: 'Chef', role: 'kitchen', createdAt: new Date().toISOString() }]), updateRole } },
        { provide: StaffAuthService, useValue: { identity: signal({ role: 'admin', fullName: 'Admin' }), signOut: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    await fixture.whenStable();
  });

  it('renders staff roles', () => {
    expect(fixture.nativeElement.textContent).toContain('chef@example.com');
    expect(fixture.nativeElement.querySelector('select')).toBeTruthy();
  });

  it('sends an explicit role update', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'cashier';
    select.dispatchEvent(new Event('change'));
    expect(updateRole).toHaveBeenCalledWith('staff-1', 'cashier');
  });
});
