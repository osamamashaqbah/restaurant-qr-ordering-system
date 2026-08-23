import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { KitchenService } from '../../core/kitchen';
import { StaffAuthService } from '../../core/supabase-auth';
import { Kitchen } from './kitchen';

describe('Kitchen', () => {
  let fixture: ComponentFixture<Kitchen>;
  let startPreparing: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    startPreparing = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [Kitchen],
      providers: [
        {
          provide: KitchenService,
          useValue: {
            getOrders: () => of([{ id: 'order-1', tableNumber: '7', status: 'new', createdAt: new Date().toISOString(), items: [] }]),
            startPreparing,
            markReady: vi.fn(() => of(void 0)),
            cancel: vi.fn(() => of(void 0)),
          },
        },
        { provide: StaffAuthService, useValue: { identity: signal({ role: 'kitchen', fullName: 'Chef' }), signOut: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Kitchen);
    await fixture.whenStable();
  });

  it('renders the board and exposes the start command', () => {
    expect(fixture.componentInstance.orders()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Table 7');
  });

  it('sends a command for the selected order', () => {
    fixture.componentInstance.transition('order-1', 'startPreparing');
    expect(startPreparing).toHaveBeenCalledWith('order-1');
  });
});
