import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Entry } from './entry';

describe('Entry', () => {
  let component: Entry;
  let fixture: ComponentFixture<Entry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Entry],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Entry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows all required field errors when an empty form is submitted', () => {
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name is required');
    expect(fixture.nativeElement.textContent).toContain('WhatsApp number');
    expect(fixture.nativeElement.textContent).toContain('Table number is required');
  });
});
