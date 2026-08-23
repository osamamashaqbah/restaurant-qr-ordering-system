import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PublicMenuService } from '../../core/public-menu';
import { Menu } from './menu';

describe('Menu', () => {
  let component: Menu;
  let fixture: ComponentFixture<Menu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Menu],
      providers: [
        {
          provide: PublicMenuService,
          useValue: { get: () => of({ categories: [], items: [] }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Menu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
