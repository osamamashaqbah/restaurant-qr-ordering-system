import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CashierService } from '../../core/cashier';
import { StaffAuthService } from '../../core/supabase-auth';
import { Cashier } from './cashier';

describe('Cashier', () => {
  let fixture: ComponentFixture<Cashier>;
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    close = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [Cashier],
      providers: [
        {
          provide: CashierService,
          useValue: {
            getOrders: () => of([{ id: 'order-1', tableNumber: '7', status: 'ready', customerName: 'Sara', customerWhatsapp: '962791234567', total: 12.5, createdAt: new Date().toISOString(), items: [] }]),
            close,
          },
        },
        { provide: StaffAuthService, useValue: { identity: signal({ role: 'cashier', fullName: 'Cashier' }), signOut: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Cashier);
    await fixture.whenStable();
  });

  it('renders ready orders', () => {
    expect(fixture.componentInstance.readyOrders()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Table 7');
  });

  it('sends the close command for the selected order', () => {
    fixture.componentInstance.close('order-1');
    expect(close).toHaveBeenCalledWith('order-1');
  });
});
