import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeoService, Title, Meta]
    });
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set full SEO metadata correctly', () => {
    service.setSeoData({
      title: 'Test Title | Krenter',
      description: 'Test description for Krenter.',
      keywords: 'rental, property, test',
      canonicalUrl: 'https://krenter.org/test',
      robots: 'index, follow'
    });

    expect(titleService.getTitle()).toBe('Test Title | Krenter');
    expect(metaService.getTag('name="description"')?.content).toBe('Test description for Krenter.');
    expect(metaService.getTag('name="keywords"')?.content).toBe('rental, property, test');
    expect(metaService.getTag('name="robots"')?.content).toBe('index, follow');
    expect(metaService.getTag('property="og:title"')?.content).toBe('Test Title | Krenter');
    expect(metaService.getTag('name="twitter:card"')?.content).toBe('summary_large_image');
  });

  it('should set noindex on private views', () => {
    service.setNoIndex('Dashboard');
    expect(titleService.getTitle()).toBe('Dashboard | Krenter');
    expect(metaService.getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });
});
