import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
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
});
