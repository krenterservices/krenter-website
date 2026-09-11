import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the main privacy policy heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Krenter Privacy Policy');
  });

  it('should display Krenter logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('img.brand-logo');
    expect(logo).toBeTruthy();
  });

  it('should contain the account and data deletion section for App Store compliance', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const deletionSection = compiled.querySelector('#section-deletion');
    expect(deletionSection).toBeTruthy();
    expect(deletionSection?.textContent).toContain('ACCOUNT & DATA DELETION PROCEDURES');
  });

  it('should contain contact information with support email', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const contactSection = compiled.querySelector('#section-contact');
    expect(contactSection).toBeTruthy();
    expect(contactSection?.textContent).toContain('support@krenter.app');
  });
});
