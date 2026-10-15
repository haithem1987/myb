import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Currency } from '../models/coproperty.model';
import { currentIntlLocale } from 'libs/shared/infra/services/language.service';

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
  private static readonly MAX_DECIMAL_PLACES = 3;
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

  formatAmount(
    amount: number | string | undefined | null,
    currency: Currency | string = this.current
  ): string {
    const rawValue = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    const currencyCode = currency as Currency;
    if (isNaN(rawValue)) return '0 ' + this.getSymbol(currencyCode);
    const value = this.roundAmount(rawValue);

    const locale = this.getDisplayLocale(currencyCode);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: CurrencyService.MAX_DECIMAL_PLACES,
    }).format(value);
  }

  formatNumber(value: number | string | undefined | null): string {
    const parsed = typeof value === 'string' ? Number(value) : Number(value ?? 0);
    return new Intl.NumberFormat(currentIntlLocale(), {
      minimumFractionDigits: 0,
      maximumFractionDigits: CurrencyService.MAX_DECIMAL_PLACES,
    }).format(this.roundAmount(Number.isFinite(parsed) ? parsed : 0));
  }

  /**
   * French keeps the currency's regional convention (e.g. fr-TN shows "DT");
   * other UI languages format with their own locale (en-GB, ar-TN).
   */
  private getDisplayLocale(currencyCode: string): string {
    const uiLocale = currentIntlLocale();
    if (!uiLocale.startsWith('fr')) return uiLocale;
    const currencyLocale = CURRENCY_LOCALES[currencyCode];
    return currencyLocale?.startsWith('fr') ? currencyLocale : uiLocale;
  }

  /** Keep arithmetic and form values out of IEEE-754 display artefacts. */
  roundAmount(amount: number | string | undefined | null): number {
    const value = typeof amount === 'string' ? Number(amount) : Number(amount ?? 0);
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** CurrencyService.MAX_DECIMAL_PLACES;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  getSymbol(currency?: string): string {
    return CURRENCY_SYMBOLS[currency ?? this.current] ?? currency ?? '€';
  }
}
