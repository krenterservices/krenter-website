import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TermsOfUseComponent } from './terms-of-use.component';

describe('TermsOfUseComponent', () => {
  let component: TermsOfUseComponent;
  let fixture: ComponentFixture<TermsOfUseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsOfUseComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsOfUseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main terms of use heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Krenter Terms of Use');
  });

  it('should display Krenter logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('img.brand-logo');
    expect(logo).toBeTruthy();
  });

  it('should contain the arbitration and dispute resolution section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const arbitrationSection = compiled.querySelector('#section-disputes');
    expect(arbitrationSection).toBeTruthy();
    expect(arbitrationSection?.textContent).toContain('DISPUTE RESOLUTION & BINDING ARBITRATION');
  });

  it('should contain app store additional terms', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const appStoreSection = compiled.querySelector('#section-mobile-terms');
    expect(appStoreSection).toBeTruthy();
    expect(appStoreSection?.textContent).toContain('Apple App Store');
  });

  it('should contain contact information with support email', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const contactSection = compiled.querySelector('#section-contact');
    expect(contactSection).toBeTruthy();
    expect(contactSection?.textContent).toContain('support@krenter.app');
  });
});
