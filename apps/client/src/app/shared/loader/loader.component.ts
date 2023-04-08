import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'fuzzy-waddle-loader',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="loader"></div>`,
  styles: [
    `
      .loader {
        margin: 50px auto 0;
        border: 16px solid #ffe6c2;
        border-top: 16px solid #9f3000;
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class LoaderComponent {}
