import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from 'libs/shared/infra/services/language.service';
@Component({
  selector: 'myb-front-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent implements OnInit {
  selectedLanguage!: string;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.languageService.language$.subscribe((language) => {
      this.selectedLanguage = language;
    });
  }

  switchLanguage(language: string): void {
    this.languageService.setLanguage(language);
  }
}
