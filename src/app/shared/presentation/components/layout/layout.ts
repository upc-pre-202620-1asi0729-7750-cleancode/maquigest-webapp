import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navigation } from '../navigation/navigation';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navigation, LanguageSwitcher, Footer],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {}
