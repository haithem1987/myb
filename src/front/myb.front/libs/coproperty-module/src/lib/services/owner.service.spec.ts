import { OwnerService } from './owner.service';
import { CopropertyInvoice } from '../models';

// Tests for pure logic methods on OwnerService (no Apollo calls).
describe('OwnerService (pure logic)', () => {
  let service: OwnerService;

  beforeEach(() => {
    // Passing a stub Apollo: the tested methods never call it.
    service = new OwnerService({} as any);
  });

  // ── getTotalPendingAmount ─────────────────────────────────────────────────

  describe('getTotalPendingAmount', () => {
    it('COP-PO-003 — sums only Pending, Overdue and PartiallyPaid invoices', () => {
      const invoices = [
        { status: 'Pending', totalAmount: 100 },
        { status: 'Overdue', totalAmount: 200 },
        { status: 'PartiallyPaid', totalAmount: 50 },
        { status: 'Paid', totalAmount: 300 },
        { status: 'Cancelled', totalAmount: 999 },
      ] as CopropertyInvoice[];

      expect(service.getTotalPendingAmount(invoices)).toBe(350);
    });

    it('returns 0 when all invoices are paid', () => {
      const invoices = [{ status: 'Paid', totalAmount: 500 }] as CopropertyInvoice[];
      expect(service.getTotalPendingAmount(invoices)).toBe(0);
    });

    it('returns 0 for an empty list', () => {
      expect(service.getTotalPendingAmount([])).toBe(0);
    });
  });

  // ── getOverdueInvoicesCount ───────────────────────────────────────────────

  describe('getOverdueInvoicesCount', () => {
    it('counts past-due Pending and PartiallyPaid invoices', () => {
      const past = new Date(Date.now() - 86_400_000).toISOString();
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const invoices = [
        { status: 'Pending', dueDate: past },
        { status: 'Pending', dueDate: future },
        { status: 'PartiallyPaid', dueDate: past },
        { status: 'Paid', dueDate: past },
        { status: 'Overdue', dueDate: past }, // Overdue but not in the Pending/PartiallyPaid check
      ] as unknown as CopropertyInvoice[];

      expect(service.getOverdueInvoicesCount(invoices)).toBe(2);
    });

    it('returns 0 when no invoices are past due', () => {
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const invoices = [{ status: 'Pending', dueDate: future }] as unknown as CopropertyInvoice[];
      expect(service.getOverdueInvoicesCount(invoices)).toBe(0);
    });
  });

  // ── getNextPaymentDueDate ─────────────────────────────────────────────────

  describe('getNextPaymentDueDate', () => {
    it('COP-PO-004 — returns the earliest pending invoice due date', () => {
      const d1 = '2030-06-01T00:00:00Z';
      const d2 = '2030-05-01T00:00:00Z';
      const invoices = [
        { status: 'Pending', dueDate: d1 },
        { status: 'Pending', dueDate: d2 },
        { status: 'Paid', dueDate: '2030-01-01T00:00:00Z' },
      ] as unknown as CopropertyInvoice[];

      const result = service.getNextPaymentDueDate(invoices);
      expect(result?.toISOString()).toBe(new Date(d2).toISOString());
    });

    it('includes PartiallyPaid invoices in the calculation', () => {
      const d = '2030-03-15T00:00:00Z';
      const invoices = [
        { status: 'PartiallyPaid', dueDate: d },
      ] as unknown as CopropertyInvoice[];

      expect(service.getNextPaymentDueDate(invoices)?.toISOString()).toBe(new Date(d).toISOString());
    });

    it('returns null when there are no pending invoices', () => {
      const invoices = [{ status: 'Paid', dueDate: '2030-01-01T00:00:00Z' }] as unknown as CopropertyInvoice[];
      expect(service.getNextPaymentDueDate(invoices)).toBeNull();
    });

    it('returns null for an empty list', () => {
      expect(service.getNextPaymentDueDate([])).toBeNull();
    });
  });
});
