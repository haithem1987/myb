import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(startName = 'startDate', endName = 'endDate'): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const start = form.get(startName)?.value;
    const end = form.get(endName)?.value;
    if (!start || !end) return null;
    return new Date(end).getTime() > new Date(start).getTime() ? null : { dateRange: true };
  };
}
