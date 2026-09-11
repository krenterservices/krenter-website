import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { SeoService } from '../../services/seo.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let seoService: SeoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), SeoService],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    seoService = TestBed.inject(SeoService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main SEO heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'All-in-One Property Management & Rental Solutions'
    );
  });

  it('should render solutions for landlords and tenants', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Property Owners & Managers');
    expect(compiled.textContent).toContain('Renters & Residents');
  });

  it('should render core features including rent payments and service requests', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Smooth Rent Payments');
    expect(compiled.textContent).toContain('Service Requests');
  });

  it('should render FAQ section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#home-faqs')).toBeTruthy();
  });
});
