/**
 * src/app/shared/components/footer/footer.component.ts
 *
 * Global footer component displaying IEM accreditation, technology stack badges,
 * and academic prototype attribution.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

