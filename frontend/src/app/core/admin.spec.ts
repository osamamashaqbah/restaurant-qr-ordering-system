import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin';

describe('AdminService', () => {
  let service: AdminService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads staff through the admin endpoint', () => {
    service.getStaff().subscribe();
    const request = controller.expectOne('/api/staff/admin/staff');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('updates only a staff role command', () => {
    service.updateRole('staff-1', 'kitchen').subscribe();
    const request = controller.expectOne('/api/staff/admin/staff/staff-1/role');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'kitchen' });
    request.flush(null);
  });
});
