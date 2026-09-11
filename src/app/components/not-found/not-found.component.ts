import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setNoIndex('Page Not Found (404)');
    this.seoService.setSeoData({
      title: 'Page Not Found (404) | Krenter Property Management',
      description: 'The requested page could not be found on Krenter. Return home or browse rental properties.',
      robots: 'noindex, nofollow'
    });
  }
}
