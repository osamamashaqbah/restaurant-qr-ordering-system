import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicRatingService } from './rating';

describe('PublicRatingService', () => {
  let service: PublicRatingService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PublicRatingService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('submits ratings by opaque tracking token', () => {
    service.submit('a'.repeat(43), 5, 'Great').subscribe();
    const request = controller.expectOne('/api/public/orders/' + 'a'.repeat(43) + '/rating');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ stars: 5, comment: 'Great' });
    request.flush(null);
  });
});
