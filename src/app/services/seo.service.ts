import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  robots?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaJson?: object | object[];
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly dom = inject(DOCUMENT);

  readonly defaultBaseUrl = 'https://krenter.org';
  readonly defaultImage = 'https://krenter.org/krenter-logo.png';
  readonly siteName = 'Krenter Property Management';

  setSeoData(config: SeoConfig): void {
    // 1. Page Title
    this.titleService.setTitle(config.title);

    // 2. Standard Meta Tags
    this.metaService.updateTag({ name: 'description', content: config.description });
    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }
    this.metaService.updateTag({ name: 'robots', content: config.robots || 'index, follow' });
    this.metaService.updateTag({ name: 'author', content: 'Krenter, Inc.' });

    // 3. Open Graph Tags
    const ogTitle = config.ogTitle || config.title;
    const ogDesc = config.ogDescription || config.description;
    const ogImg = config.ogImage
      ? (config.ogImage.startsWith('http') ? config.ogImage : `${this.defaultBaseUrl}${config.ogImage}`)
      : this.defaultImage;
    const ogUrl = config.canonicalUrl || config.ogUrl || this.defaultBaseUrl;

    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:title', content: ogTitle });
    this.metaService.updateTag({ property: 'og:description', content: ogDesc });
    this.metaService.updateTag({ property: 'og:image', content: ogImg });
    this.metaService.updateTag({ property: 'og:url', content: ogUrl });
    this.metaService.updateTag({ property: 'og:type', content: config.ogType || 'website' });
    this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });

    // 4. Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: config.twitterCard || 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: config.twitterTitle || ogTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: config.twitterDescription || ogDesc });
    this.metaService.updateTag({ name: 'twitter:image', content: config.twitterImage || ogImg });

    // 5. Canonical Link
    if (config.canonicalUrl) {
      this.setCanonicalUrl(config.canonicalUrl);
    }

    // 6. JSON-LD Schema
    if (config.schemaJson) {
      this.setJsonLd(config.schemaJson);
    }
  }

  setNoIndex(title: string = 'Krenter'): void {
    this.titleService.setTitle(`${title} | Krenter`);
    this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  setCanonicalUrl(url: string): void {
    if (!this.dom || !this.dom.head) return;
    let link: HTMLLinkElement | null = this.dom.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.dom.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.dom.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  setJsonLd(schema: object | object[]): void {
    if (!this.dom || !this.dom.head) return;
    let script: HTMLScriptElement | null = this.dom.querySelector('script[type="application/ld+json"]#krenter-seo-schema');
    if (!script) {
      script = this.dom.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'krenter-seo-schema');
      this.dom.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema, null, 2);
  }
}
