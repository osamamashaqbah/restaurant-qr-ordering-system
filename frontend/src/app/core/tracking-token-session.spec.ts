import { TestBed } from '@angular/core/testing';
import { TrackingTokenSessionService } from './tracking-token-session';

describe('TrackingTokenSession', () => {
  let service: TrackingTokenSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingTokenSessionService);
  });

  it('keeps the capability out of the URL while the tab remains open', () => {
    service.set('a'.repeat(43));
    expect(service.get()).toBe('a'.repeat(43));
    service.clear();
    expect(service.get()).toBe('');
  });
});
