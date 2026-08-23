import { TestBed } from '@angular/core/testing';
import { CustomerSessionService } from './customer-session';

describe('CustomerSession', () => {
  let service: CustomerSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomerSessionService);
  });

  it('persists and restores the customer session', () => {
    service.set({ name: 'Sara', whatsapp: '962791234567', tableNumber: '7' });

    expect(service.session()).toEqual({ name: 'Sara', whatsapp: '962791234567', tableNumber: '7' });
    expect(JSON.parse(sessionStorage.getItem('customer_session')!)).toEqual(service.session());
  });

  it('clears the customer session', () => {
    service.set({ name: 'Sara', whatsapp: '962791234567', tableNumber: '7' });
    service.clear();

    expect(service.session()).toBeNull();
    expect(sessionStorage.getItem('customer_session')).toBeNull();
  });

  it('is provided by the root injector', () => {
    expect(service).toBeTruthy();
  });
});
