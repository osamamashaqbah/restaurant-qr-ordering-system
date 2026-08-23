import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminMenuService } from './admin-menu';

describe('AdminMenuService', () => {
  let service: AdminMenuService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AdminMenuService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads the admin menu contract', () => {
    service.get().subscribe();
    const request = controller.expectOne('/api/staff/admin/menu');
    expect(request.request.method).toBe('GET');
    request.flush({ categories: [], items: [] });
  });

  it('uses explicit item update and delete routes', () => {
    service.updateItem('item-1', { categoryId: 'cat-1', nameEn: 'Hummus', nameAr: 'حمص', descriptionEn: '', descriptionAr: '', price: 3, imageUrl: null, allergens: [], isAvailable: true }).subscribe();
    const update = controller.expectOne('/api/staff/admin/menu/items/item-1');
    expect(update.request.method).toBe('PUT');
    update.flush(null);

    service.deleteItem('item-1').subscribe();
    const remove = controller.expectOne('/api/staff/admin/menu/items/item-1');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });
});
