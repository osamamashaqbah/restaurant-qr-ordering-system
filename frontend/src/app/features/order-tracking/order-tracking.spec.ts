import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OrderTrackingService } from '../../core/order-tracking';
import { OrderTracking } from './order-tracking';

describe('OrderTracking', () => {
  let component: OrderTracking;
  let fixture: ComponentFixture<OrderTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTracking],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'invalid' } } } },
        { provide: OrderTrackingService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTracking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a safe state for an invalid token without making a request', () => {
    expect(fixture.nativeElement.textContent).toContain('invalid or has expired');
  });

  it('stops polling after the order reaches a final state', async () => {
    vi.useFakeTimers();
    const get = vi.fn(() => of({
      status: 'closed',
      total: 12.5,
      createdAt: '2026-08-23T10:00:00Z',
      updatedAt: '2026-08-23T10:05:00Z',
      closedAt: '2026-08-23T10:05:00Z',
      items: [],
    }));

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OrderTracking],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'A'.repeat(43) } } } },
        { provide: OrderTrackingService, useValue: { get } },
      ],
    }).compileComponents();

    const trackedFixture = TestBed.createComponent(OrderTracking);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(30_000);

    expect(get).toHaveBeenCalledOnce();
    trackedFixture.destroy();
    vi.useRealTimers();
  });
});
