import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Currency } from '../models/coproperty.model';

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  TND: 'DT',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'CA$',
  AED: 'AED',
  MAD: 'MAD',
};

const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'fr-FR',
  USD: 'en-US',
  TND: 'fr-TN',
  GBP: 'en-GB',
  CHF: 'fr-CH',
  CAD: 'en-CA',
  AED: 'ar-AE',
  MAD: 'fr-MA',
};

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private currencySubject = new BehaviorSubject<Currency>(Currency.EUR);
  currency$ = this.currencySubject.asObservable();

  get current(): Currency {
    return this.currencySubject.value;
  }

  get symbol(): string {
    return CURRENCY_SYMBOLS[this.current] ?? this.current;
  }

  setCurrency(currency: Currency): void {
    this.currencySubject.next(currency);
  }

  formatAmount(amount: number | string | undefined | null): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    if (isNaN(value)) return '0,00 ' + this.symbol;

    const locale = CURRENCY_LOCALES[this.current] ?? 'fr-FR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.current,
    }).format(value);
  }

  getSymbol(currency?: string): string {
    return CURRENCY_SYMBOLS[currency ?? this.current] ?? currency ?? '€';
  }
}
