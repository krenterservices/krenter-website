import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SupportComponent } from './support.component';

describe('SupportComponent', () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the support header with title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.support-header h1')?.textContent).toContain('Krenter Support');
  });

  it('should display app logo', () => {
    const compiled = fixture.nativeElement;
    const logo = compiled.querySelector('.app-logo');
    expect(logo).toBeTruthy();
  });

  it('should link to privacy policy', () => {
    const compiled = fixture.nativeElement;
    const privacyLink = compiled.querySelector('a[routerLink="/privacy-policy"]');
    expect(privacyLink).toBeTruthy();
  });

  it('should contain features section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.features-section')).toBeTruthy();
  });

  it('should contain getting started section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.getting-started-section')).toBeTruthy();
  });

  it('should contain FAQ section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.faq-section')).toBeTruthy();
  });

  it('should contain troubleshooting section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.troubleshooting-section')).toBeTruthy();
  });

  it('should contain system requirements section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.requirements-section')).toBeTruthy();
  });

  it('should contain contact support section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.contact-section')).toBeTruthy();
  });

  it('should contain privacy section', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.privacy-section')).toBeTruthy();
  });
});

