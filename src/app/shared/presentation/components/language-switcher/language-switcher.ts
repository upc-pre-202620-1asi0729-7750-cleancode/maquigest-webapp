import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  protected currentLang = 'en';
  protected languages: string[];

  readonly #translate = inject(TranslateService);

  constructor() {
    this.currentLang = this.#translate.getCurrentLang() ?? 'en';
    this.languages = [...this.#translate.getLangs()];
  }

  protected useLanguage(language: string): void {
    this.#translate.use(language);
    this.currentLang = language;
  }
}
