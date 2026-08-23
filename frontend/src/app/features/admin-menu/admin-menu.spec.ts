import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminMenuService } from '../../core/admin-menu';
import { PublicMenuResponse } from '../../core/public-menu';
import { AdminMenu } from './admin-menu';

describe('AdminMenu', () => {
  let component: AdminMenu;
  let fixture: ComponentFixture<AdminMenu>;
  let updateItem: ReturnType<typeof vi.fn>;

  const menu: PublicMenuResponse = {
    categories: [{ id: 'cat-1', nameEn: 'Mains', nameAr: 'رئيسي', sortOrder: 1 }],
    items: [{
      id: 'item-1',
      categoryId: 'cat-1',
      nameEn: 'Hummus',
      nameAr: 'حمص',
      descriptionEn: 'Chickpeas with tahini',
      descriptionAr: 'حمص مع طحينة',
      price: 3,
      imageUrl: 'https://example.com/hummus.jpg',
      allergens: ['sesame'],
      isAvailable: true,
    }],
  };

  beforeEach(async () => {
    updateItem = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [AdminMenu],
      providers: [
        provideRouter([]),
        {
          provide: AdminMenuService,
          useValue: {
            get: () => of(menu),
            updateItem,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('preserves existing item metadata when editing another field', () => {
    component.editItem(menu.items[0]);
    component.itemForm.controls.price.setValue(3.5);

    component.saveItem();

    expect(updateItem).toHaveBeenCalledWith('item-1', expect.objectContaining({
      price: 3.5,
      descriptionEn: 'Chickpeas with tahini',
      descriptionAr: 'حمص مع طحينة',
      imageUrl: 'https://example.com/hummus.jpg',
      allergens: ['sesame'],
    }));
  });
});
