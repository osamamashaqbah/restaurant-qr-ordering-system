import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Guide } from './guide';

describe('Guide', () => {
  let fixture: ComponentFixture<Guide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Guide],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Guide);
    await fixture.whenStable();
  });

  it('explains the active stack and interview areas', () => {
    const page = fixture.nativeElement as HTMLElement;

    expect(page.textContent).toContain('Angular 22 + TypeScript');
    expect(page.textContent).toContain('ASP.NET Core 8 Web API');
    expect(page.textContent).toContain('Supabase Postgres');
    expect(page.textContent).toContain('أسئلة Angular');
    expect(page.textContent).toContain('أسئلة ASP.NET Core');
  });
});
