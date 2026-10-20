import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { OwnerManagementComponent } from './owner-management.component';
import { UnitService } from '../../services/unit.service';
import { CopropertyService } from '../../services/coproperty.service';
import { OwnerService } from '../../services/owner.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ModalService, NotificationService } from '@myb-front/shared-ui';
import { ActiveCopropertyService } from '../../services/active-coproperty.service';

const COPROPERTY_ID = 'cop-1';

function makeOwner(overrides: Partial<{ id: string; firstName: string; lastName: string; email: string; phone: string; ownerUnits: any[] }> = {}) {
  return { id: '1', firstName: 'Alice', lastName: 'Martin', email: 'alice@test.com', phone: '', ...overrides };
}

function makeUnit(id: string, unitNumber: string, ownerUnits: any[] = []) {
  return { id, unitNumber, copropertyId: COPROPERTY_ID, ownerUnits };
}

describe('OwnerManagementComponent', () => {
  let component: OwnerManagementComponent;

  const ownerServiceMock = {
    getAllOwners: jest.fn(() => of([])),
    createOwner: jest.fn(() => of({ id: 'new-owner' })),
    updateOwner: jest.fn(() => of({ id: 'existing-owner' })),
    deleteOwner: jest.fn(() => of(true)),
    changeUnitOwner: jest.fn(() => of({})),
  };

  const unitServiceMock = {
    getUnitsByCoproperty: jest.fn(() => of([])),
  };

  const copropertyServiceMock = {
    getCoproperties: jest.fn(() => of([])),
  };

  const keycloakServiceMock = {
    getSyndicManagerId: jest.fn(() => 'mgr-1'),
    getUserClientRoles: jest.fn(() => Promise.resolve([])),
    assignRoleToUser: jest.fn(() => Promise.resolve()),
    unassignRoleFromUser: jest.fn(() => Promise.resolve()),
    searchOwnerCandidates: jest.fn(() => Promise.resolve([])),
    createUser: jest.fn(() => Promise.resolve('new-kc-user')),
  };

  const notificationServiceMock = { dataChanges$: new Subject<void>() };
  const modalServiceMock = { confirm: jest.fn(() => Promise.resolve(true)) };
  const activeCopropertyMock = {
    selectAvailable: jest.fn(() => COPROPERTY_ID),
    setActive: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [OwnerManagementComponent, TranslateModule.forRoot()],
      providers: [
        { provide: UnitService, useValue: unitServiceMock },
        { provide: CopropertyService, useValue: copropertyServiceMock },
        { provide: OwnerService, useValue: ownerServiceMock },
        { provide: KeycloakService, useValue: keycloakServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: ActiveCopropertyService, useValue: activeCopropertyMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OwnerManagementComponent);
    component = fixture.componentInstance;
    component.copropertyId = COPROPERTY_ID;
    component.coproperties.set([{ id: COPROPERTY_ID, name: 'Résidence A', isActive: true }]);
    fixture.detectChanges();
  });

  // ── filteredOwners ────────────────────────────────────────────────────────

  it('COP-OW-007 — filteredOwners: returns all owners when search is empty', () => {
    component.owners = [makeOwner({ id: '1' }), makeOwner({ id: '2', firstName: 'Bob', lastName: 'Dupont' })];
    component.searchTerm = '';
    expect(component.filteredOwners.length).toBe(2);
  });

  it('COP-OW-007 — filteredOwners: matches first name case-insensitively', () => {
    component.owners = [makeOwner({ firstName: 'Alice' }), makeOwner({ id: '2', firstName: 'Bob', lastName: 'Dupont', email: 'b@b.com' })];
    component.searchTerm = 'ALICE';
    expect(component.filteredOwners.length).toBe(1);
    expect(component.filteredOwners[0].firstName).toBe('Alice');
  });

  it('COP-OW-007 — filteredOwners: matches email', () => {
    component.owners = [makeOwner({ email: 'alice@corp.com' }), makeOwner({ id: '2', firstName: 'Bob', lastName: 'B', email: 'bob@corp.com' })];
    component.searchTerm = 'alice@';
    expect(component.filteredOwners.length).toBe(1);
  });

  it('COP-OW-007 — filteredOwners: filters by unit when ownerUnitFilter is set', () => {
    component.owners = [
      makeOwner({ id: '1', ownerUnits: [{ id: 'ou1', unitId: 'u1', ownershipPercentage: 100, isMainOwner: true }] }),
      makeOwner({ id: '2', firstName: 'Bob', lastName: 'B', email: 'b@b.com', ownerUnits: [{ id: 'ou2', unitId: 'u2', ownershipPercentage: 100, isMainOwner: true }] }),
    ];
    component.ownerUnitFilter = 'u2';
    expect(component.filteredOwners.length).toBe(1);
    expect(component.filteredOwners[0].id).toBe('2');
  });

  // ── filteredAvailableUnits ────────────────────────────────────────────────

  it('COP-OW-001 — filteredAvailableUnits: excludes unit occupied by another owner', () => {
    component.availableUnits = [
      makeUnit('u1', 'A101', [{ ownerId: 'other', endDate: null }]),
      makeUnit('u2', 'A102'),
    ];
    component.owners = [];
    component.editingOwnerId = null;

    const result = component.filteredAvailableUnits;
    expect(result.find(u => u.id === 'u1')).toBeUndefined();
    expect(result.find(u => u.id === 'u2')).toBeDefined();
  });

  it('COP-OW-001 — filteredAvailableUnits: includes unit already assigned to the owner being edited', () => {
    component.editingOwnerId = 'owner-1';
    component.availableUnits = [makeUnit('u1', 'A101', [{ ownerId: 'owner-1', endDate: null }])];
    component.owners = [];

    expect(component.filteredAvailableUnits.find(u => u.id === 'u1')).toBeDefined();
  });

  it('filteredAvailableUnits: unit search filters by unitNumber', () => {
    component.availableUnits = [makeUnit('u1', 'A101'), makeUnit('u2', 'B201')];
    component.owners = [];
    component.editingOwnerId = null;
    component.unitSearchTerm = 'B2';

    expect(component.filteredAvailableUnits.length).toBe(1);
    expect(component.filteredAvailableUnits[0].id).toBe('u2');
  });

  // ── saveOwner validation ──────────────────────────────────────────────────

  it('COP-CP-006 — saveOwner: blocks new owner when no unit is selected', () => {
    component.allUnits = [makeUnit('u1', 'A101')];
    component.editingOwnerId = null;
    component.selectedKeycloakUser.set({ id: 'kc-1', email: 'a@a.com', firstName: 'A', lastName: 'B', enabled: true, emailVerified: true, roles: [] });
    component.ownerForm.patchValue({ selectedUnits: [] });

    component.saveOwner();

    expect(ownerServiceMock.createOwner).not.toHaveBeenCalled();
  });

  it('COP-CP-006 — saveOwner: blocks new owner when no Keycloak user is selected', () => {
    component.allUnits = [makeUnit('u1', 'A101')];
    component.editingOwnerId = null;
    component.selectedKeycloakUser.set(null);
    component.ownerForm.patchValue({ selectedUnits: ['u1'] });

    component.saveOwner();

    expect(ownerServiceMock.createOwner).not.toHaveBeenCalled();
  });

  it('COP-CP-009 — saveOwner: blocked on inactive coproperty', () => {
    component.coproperties.set([{ id: COPROPERTY_ID, name: 'X', isActive: false }]);
    component.saveOwner();
    expect(ownerServiceMock.createOwner).not.toHaveBeenCalled();
  });

  // ── Keycloak user selection ───────────────────────────────────────────────

  it('COP-KC-004 — selectKeycloakUser: pre-fills the form with Keycloak user data', () => {
    const user = { id: 'kc-1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Martin', phone: '0600000000', enabled: true, emailVerified: true, roles: [] };
    component.selectKeycloakUser(user);

    expect(component.selectedKeycloakUser()).toEqual(user);
    expect(component.ownerForm.get('email')?.value).toBe('alice@test.com');
    expect(component.ownerForm.get('firstName')?.value).toBe('Alice');
    expect(component.ownerForm.get('phone')?.value).toBe('0600000000');
  });

  it('clearSelectedUser: clears the form fields and selection', () => {
    component.selectedKeycloakUser.set({ id: 'kc-1', email: 'a@a.com', firstName: 'A', lastName: 'B', enabled: true, emailVerified: true, roles: [] });
    component.clearSelectedUser();

    expect(component.selectedKeycloakUser()).toBeNull();
    expect(component.ownerForm.get('email')?.value).toBe('');
  });

  // ── isSelectedCopropertyActive ────────────────────────────────────────────

  it('COP-CP-009 — isSelectedCopropertyActive: returns false for inactive coproperty', () => {
    component.coproperties.set([{ id: COPROPERTY_ID, name: 'X', isActive: false }]);
    expect(component.isSelectedCopropertyActive()).toBe(false);
  });

  it('isSelectedCopropertyActive: returns true for active coproperty', () => {
    component.coproperties.set([{ id: COPROPERTY_ID, name: 'X', isActive: true }]);
    expect(component.isSelectedCopropertyActive()).toBe(true);
  });

  it('isSelectedCopropertyActive: returns false when copropertyId is unset', () => {
    component.copropertyId = undefined;
    expect(component.isSelectedCopropertyActive()).toBe(false);
  });

  // ── Unit selection helpers ────────────────────────────────────────────────

  it('toggleUnitSelection: adds unit to selection', () => {
    component.ownerForm.patchValue({ selectedUnits: [] });
    component.toggleUnitSelection('u1');
    expect(component.isUnitSelected('u1')).toBe(true);
  });

  it('toggleUnitSelection: removes unit when already selected', () => {
    component.ownerForm.patchValue({ selectedUnits: ['u1', 'u2'] });
    component.toggleUnitSelection('u1');
    expect(component.isUnitSelected('u1')).toBe(false);
    expect(component.isUnitSelected('u2')).toBe(true);
  });

  // ── Miscellaneous helpers ─────────────────────────────────────────────────

  it('getOwnerFullName: returns "firstName lastName"', () => {
    expect(component.getOwnerFullName(makeOwner({ firstName: 'Jean', lastName: 'Dupont' }))).toBe('Jean Dupont');
  });

  it('cancelForm: hides the form and resets editing state', () => {
    component.showAddForm = true;
    component.editingOwnerId = 'some-id';
    component.cancelForm();

    expect(component.showAddForm).toBe(false);
    expect(component.editingOwnerId).toBeNull();
    expect(component.selectedKeycloakUser()).toBeNull();
  });

  it('onCopropertySelectionChange: no-op when same id is passed', () => {
    const loadSpy = jest.spyOn(component as any, 'loadOwners');
    component.onCopropertySelectionChange(COPROPERTY_ID);
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('userHasOwnerRole: returns true when roles include coproperty-owner', () => {
    const user = { id: 'u', email: '', firstName: '', lastName: '', enabled: true, emailVerified: true, roles: ['coproperty-owner'] };
    expect(component.userHasOwnerRole(user)).toBe(true);
  });

  it('userHasOwnerRole: returns false when role is absent', () => {
    const user = { id: 'u', email: '', firstName: '', lastName: '', enabled: true, emailVerified: true, roles: [] };
    expect(component.userHasOwnerRole(user)).toBe(false);
  });
});
