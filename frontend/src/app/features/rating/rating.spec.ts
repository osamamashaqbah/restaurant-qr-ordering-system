import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PublicRatingService } from '../../core/rating';
import { Rating } from './rating';

describe('Rating', () => {
  let fixture: ComponentFixture<Rating>;
  let submit: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    submit = vi.fn(() => of(void 0));
    await TestBed.configureTestingModule({
      imports: [Rating],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'a'.repeat(43) } } } },
        { provide: PublicRatingService, useValue: { submit } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Rating);
    await fixture.whenStable();
  });

  it('requires a star selection before submitting', () => {
    fixture.componentInstance.submit();
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits the selected rating', () => {
    fixture.componentInstance.setStars(4);
    fixture.componentInstance.submit();
    expect(submit).toHaveBeenCalledWith('a'.repeat(43), 4, '');
  });
});
