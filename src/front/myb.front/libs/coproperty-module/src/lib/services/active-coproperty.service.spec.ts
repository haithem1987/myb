import { TestBed } from '@angular/core/testing';
import { ActiveCopropertyService } from './active-coproperty.service';

function freshService(): ActiveCopropertyService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ActiveCopropertyService);
}

describe('ActiveCopropertyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── selectAvailable ───────────────────────────────────────────────────────

  describe('selectAvailable', () => {
    it('prefers the currently active id when it is in the list', () => {
      const service = freshService();
      service.setActive('cop-2');

      const result = service.selectAvailable([
        { id: 'cop-1', isActive: true },
        { id: 'cop-2', isActive: true },
      ]);

      expect(result).toBe('cop-2');
    });

    it('COP-CP-016 — falls back to first active coproperty when nothing is stored', () => {
      const service = freshService();

      const result = service.selectAvailable([
        { id: 'cop-1', isActive: false },
        { id: 'cop-2', isActive: true },
        { id: 'cop-3', isActive: true },
      ]);

      expect(result).toBe('cop-2');
    });

    it('falls back to first coproperty when none has isActive: true', () => {
      const service = freshService();

      const result = service.selectAvailable([{ id: 'cop-1' }, { id: 'cop-2' }]);

      expect(result).toBe('cop-1');
    });

    it('prefers an explicitly requested id over the stored one', () => {
      const service = freshService();
      service.setActive('cop-2');

      const result = service.selectAvailable(
        [{ id: 'cop-1', isActive: true }, { id: 'cop-2', isActive: true }],
        'cop-1'
      );

      expect(result).toBe('cop-1');
    });

    it('returns empty string for an empty list', () => {
      const service = freshService();
      expect(service.selectAvailable([])).toBe('');
    });
  });

  // ── setActive ─────────────────────────────────────────────────────────────

  describe('setActive', () => {
    it('updates the activeId signal', () => {
      const service = freshService();
      service.setActive('cop-42');
      expect(service.activeId()).toBe('cop-42');
    });

    it('persists the id to localStorage', () => {
      const service = freshService();
      service.setActive('cop-99');
      expect(localStorage.getItem('activeCopropertyId')).toBe('cop-99');
    });

    it('no-op when called with falsy value', () => {
      const service = freshService();
      service.setActive('cop-1');
      service.setActive(null);
      expect(service.activeId()).toBe('cop-1');
    });
  });

  // ── route ─────────────────────────────────────────────────────────────────

  describe('route', () => {
    it('COP-PO-001 — returns /coproperty/:id/owner/... when an id is set', () => {
      const service = freshService();
      service.setActive('cop-99');
      expect(service.route('owner', 'my-units')).toEqual(['/coproperty', 'cop-99', 'owner', 'my-units']);
    });

    it('returns /coproperty/:id/syndic/dashboard for syndic routes', () => {
      const service = freshService();
      service.setActive('cop-1');
      expect(service.route('syndic', 'dashboard')).toEqual(['/coproperty', 'cop-1', 'syndic', 'dashboard']);
    });

    it('returns ["/coproperty", "select"] when no coproperty is selected', () => {
      const service = freshService();
      expect(service.route('owner')).toEqual(['/coproperty', 'select']);
    });
  });
});
