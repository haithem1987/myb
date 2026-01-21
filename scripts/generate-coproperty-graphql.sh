#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
error() { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
step() { echo -e "${BLUE}▶ $1${NC}"; }

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Coproperty GraphQL Services Generator              ║"
echo "║  Generates GraphQL queries, mutations, and services  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Project paths
FRONTEND_PATH="/Volumes/NidhalSSD/Projects/myb/src/front/myb.front"
COPROPERTY_MODULE="$FRONTEND_PATH/libs/coproperty-module/src/lib"
GRAPHQL_DIR="$COPROPERTY_MODULE/graphql"

# Create GraphQL directory structure
step "Creating GraphQL directory structure..."
mkdir -p "$GRAPHQL_DIR/queries"
mkdir -p "$GRAPHQL_DIR/mutations"
mkdir -p "$COPROPERTY_MODULE/services"
success "Directory structure created"

# ============================================
# UNIT GRAPHQL QUERIES
# ============================================
step "Generating Unit GraphQL queries..."
cat > "$GRAPHQL_DIR/queries/unit.query.ts" <<'EOF'
import gql from 'graphql-tag';

export const GET_ALL_UNITS = gql`
  query GetAllUnits {
    allUnits {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const GET_UNIT_BY_ID = gql`
  query GetUnitById($id: Int!) {
    unitById(id: $id) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const GET_UNITS_BY_COPROPERTY = gql`
  query GetUnitsByCoproperty($copropertyId: Int!) {
    unitsByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;
EOF
success "Unit queries created"

# ============================================
# UNIT GRAPHQL MUTATIONS
# ============================================
step "Generating Unit GraphQL mutations..."
cat > "$GRAPHQL_DIR/mutations/unit.mutation.ts" <<'EOF'
import gql from 'graphql-tag';

export const CREATE_UNIT = gql`
  mutation CreateUnit($item: UnitInput!) {
    createUnit(unit: $item) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_UNIT = gql`
  mutation UpdateUnit($item: UnitInput!) {
    updateUnit(unit: $item) {
      id
      copropertyId
      unitNumber
      floor
      type
      area
      shares
      ownerName
      ownerEmail
      ownerPhone
      isOccupied
      rentedTo
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_UNIT = gql`
  mutation DeleteUnit($id: Int!) {
    deleteUnit(id: $id)
  }
`;
EOF
success "Unit mutations created"

# ============================================
# MAINTENANCE GRAPHQL QUERIES
# ============================================
step "Generating Maintenance GraphQL queries..."
cat > "$GRAPHQL_DIR/queries/maintenance.query.ts" <<'EOF'
import gql from 'graphql-tag';

export const GET_ALL_MAINTENANCE_REQUESTS = gql`
  query GetAllMaintenanceRequests {
    allMaintenanceRequests {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const GET_MAINTENANCE_REQUEST_BY_ID = gql`
  query GetMaintenanceRequestById($id: Int!) {
    maintenanceRequestById(id: $id) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const GET_MAINTENANCE_BY_COPROPERTY = gql`
  query GetMaintenanceByCoproperty($copropertyId: Int!) {
    maintenanceByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const GET_MAINTENANCE_BY_STATUS = gql`
  query GetMaintenanceByStatus($copropertyId: Int!, $status: String!) {
    maintenanceByStatus(copropertyId: $copropertyId, status: $status) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;
EOF
success "Maintenance queries created"

# ============================================
# MAINTENANCE GRAPHQL MUTATIONS
# ============================================
step "Generating Maintenance GraphQL mutations..."
cat > "$GRAPHQL_DIR/mutations/maintenance.mutation.ts" <<'EOF'
import gql from 'graphql-tag';

export const CREATE_MAINTENANCE_REQUEST = gql`
  mutation CreateMaintenanceRequest($item: MaintenanceRequestInput!) {
    createMaintenanceRequest(maintenanceRequest: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MAINTENANCE_REQUEST = gql`
  mutation UpdateMaintenanceRequest($item: MaintenanceRequestInput!) {
    updateMaintenanceRequest(maintenanceRequest: $item) {
      id
      copropertyId
      unitId
      title
      description
      category
      priority
      status
      reportedBy
      assignedTo
      estimatedCost
      actualCost
      scheduledDate
      completedDate
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_MAINTENANCE_REQUEST = gql`
  mutation DeleteMaintenanceRequest($id: Int!) {
    deleteMaintenanceRequest(id: $id)
  }
`;

export const UPDATE_MAINTENANCE_STATUS = gql`
  mutation UpdateMaintenanceStatus($id: Int!, $status: String!) {
    updateMaintenanceStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;
EOF
success "Maintenance mutations created"

# ============================================
# CHARGE GRAPHQL QUERIES
# ============================================
step "Generating Charge GraphQL queries..."
cat > "$GRAPHQL_DIR/queries/charge.query.ts" <<'EOF'
import gql from 'graphql-tag';

export const GET_ALL_CHARGES = gql`
  query GetAllCharges {
    allCharges {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHARGE_BY_ID = gql`
  query GetChargeById($id: Int!) {
    chargeById(id: $id) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHARGES_BY_COPROPERTY = gql`
  query GetChargesByCoproperty($copropertyId: Int!) {
    chargesByCoproperty(copropertyId: $copropertyId) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;
EOF
success "Charge queries created"

# ============================================
# CHARGE GRAPHQL MUTATIONS
# ============================================
step "Generating Charge GraphQL mutations..."
cat > "$GRAPHQL_DIR/mutations/charge.mutation.ts" <<'EOF'
import gql from 'graphql-tag';

export const CREATE_CHARGE = gql`
  mutation CreateCharge($item: ChargeInput!) {
    createCharge(charge: $item) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CHARGE = gql`
  mutation UpdateCharge($item: ChargeInput!) {
    updateCharge(charge: $item) {
      id
      copropertyId
      name
      description
      chargeType
      frequency
      totalAmount
      distributionMethod
      startDate
      endDate
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CHARGE = gql`
  mutation DeleteCharge($id: Int!) {
    deleteCharge(id: $id)
  }
`;

export const CALCULATE_CHARGE_DISTRIBUTION = gql`
  mutation CalculateChargeDistribution($chargeId: Int!) {
    calculateChargeDistribution(chargeId: $chargeId) {
      unitId
      unitNumber
      amount
      shares
      area
    }
  }
`;
EOF
success "Charge mutations created"

# ============================================
# UNIT SERVICE
# ============================================
step "Generating Unit Service..."
cat > "$COPROPERTY_MODULE/services/unit.service.ts" <<'EOF'
import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_UNITS,
  GET_UNIT_BY_ID,
  GET_UNITS_BY_COPROPERTY,
} from '../graphql/queries/unit.query';
import {
  CREATE_UNIT,
  UPDATE_UNIT,
  DELETE_UNIT,
} from '../graphql/mutations/unit.mutation';

export interface Unit {
  id?: number;
  copropertyId: number;
  unitNumber: string;
  floor: number;
  type: 'APARTMENT' | 'PARKING' | 'CAVE' | 'COMMERCIAL' | 'OTHER';
  area: number;
  shares: number;
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  isOccupied: boolean;
  rentedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UnitService {
  private apollo = inject(Apollo);

  getAllUnits(): Observable<Unit[]> {
    return this.apollo
      .query<{ allUnits: Unit[] }>({
        query: GET_ALL_UNITS,
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allUnits));
  }

  getUnitById(id: number): Observable<Unit> {
    return this.apollo
      .query<{ unitById: Unit }>({
        query: GET_UNIT_BY_ID,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.unitById));
  }

  getUnitsByCoproperty(copropertyId: number): Observable<Unit[]> {
    return this.apollo
      .query<{ unitsByCoproperty: Unit[] }>({
        query: GET_UNITS_BY_COPROPERTY,
        variables: { copropertyId },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.unitsByCoproperty));
  }

  createUnit(unit: Unit): Observable<Unit> {
    return this.apollo
      .mutate<{ createUnit: Unit }>({
        mutation: CREATE_UNIT,
        variables: { item: unit },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createUnit));
  }

  updateUnit(unit: Unit): Observable<Unit> {
    return this.apollo
      .mutate<{ updateUnit: Unit }>({
        mutation: UPDATE_UNIT,
        variables: { item: unit },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateUnit));
  }

  deleteUnit(id: number): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteUnit: boolean }>({
        mutation: DELETE_UNIT,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteUnit));
  }
}
EOF
success "Unit service created"

# ============================================
# MAINTENANCE SERVICE
# ============================================
step "Generating Maintenance Service..."
cat > "$COPROPERTY_MODULE/services/maintenance.service.ts" <<'EOF'
import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_MAINTENANCE_REQUESTS,
  GET_MAINTENANCE_REQUEST_BY_ID,
  GET_MAINTENANCE_BY_COPROPERTY,
  GET_MAINTENANCE_BY_STATUS,
} from '../graphql/queries/maintenance.query';
import {
  CREATE_MAINTENANCE_REQUEST,
  UPDATE_MAINTENANCE_REQUEST,
  DELETE_MAINTENANCE_REQUEST,
  UPDATE_MAINTENANCE_STATUS,
} from '../graphql/mutations/maintenance.mutation';

export interface MaintenanceRequest {
  id?: number;
  copropertyId: number;
  unitId?: number;
  title: string;
  description: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'HEATING' | 'ELEVATOR' | 'ROOF' | 'FACADE' | 'OTHER';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reportedBy: string;
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private apollo = inject(Apollo);

  getAllMaintenanceRequests(): Observable<MaintenanceRequest[]> {
    return this.apollo
      .query<{ allMaintenanceRequests: MaintenanceRequest[] }>({
        query: GET_ALL_MAINTENANCE_REQUESTS,
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allMaintenanceRequests));
  }

  getMaintenanceRequestById(id: number): Observable<MaintenanceRequest> {
    return this.apollo
      .query<{ maintenanceRequestById: MaintenanceRequest }>({
        query: GET_MAINTENANCE_REQUEST_BY_ID,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceRequestById));
  }

  getMaintenanceByCoproperty(copropertyId: number): Observable<MaintenanceRequest[]> {
    return this.apollo
      .query<{ maintenanceByCoproperty: MaintenanceRequest[] }>({
        query: GET_MAINTENANCE_BY_COPROPERTY,
        variables: { copropertyId },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceByCoproperty));
  }

  getMaintenanceByStatus(copropertyId: number, status: string): Observable<MaintenanceRequest[]> {
    return this.apollo
      .query<{ maintenanceByStatus: MaintenanceRequest[] }>({
        query: GET_MAINTENANCE_BY_STATUS,
        variables: { copropertyId, status },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.maintenanceByStatus));
  }

  createMaintenanceRequest(request: MaintenanceRequest): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ createMaintenanceRequest: MaintenanceRequest }>({
        mutation: CREATE_MAINTENANCE_REQUEST,
        variables: { item: request },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createMaintenanceRequest));
  }

  updateMaintenanceRequest(request: MaintenanceRequest): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ updateMaintenanceRequest: MaintenanceRequest }>({
        mutation: UPDATE_MAINTENANCE_REQUEST,
        variables: { item: request },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateMaintenanceRequest));
  }

  deleteMaintenanceRequest(id: number): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteMaintenanceRequest: boolean }>({
        mutation: DELETE_MAINTENANCE_REQUEST,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteMaintenanceRequest));
  }

  updateMaintenanceStatus(id: number, status: string): Observable<MaintenanceRequest> {
    return this.apollo
      .mutate<{ updateMaintenanceStatus: MaintenanceRequest }>({
        mutation: UPDATE_MAINTENANCE_STATUS,
        variables: { id, status },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateMaintenanceStatus));
  }
}
EOF
success "Maintenance service created"

# ============================================
# CHARGE SERVICE
# ============================================
step "Generating Charge Service..."
cat > "$COPROPERTY_MODULE/services/charge.service.ts" <<'EOF'
import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  GET_ALL_CHARGES,
  GET_CHARGE_BY_ID,
  GET_CHARGES_BY_COPROPERTY,
} from '../graphql/queries/charge.query';
import {
  CREATE_CHARGE,
  UPDATE_CHARGE,
  DELETE_CHARGE,
  CALCULATE_CHARGE_DISTRIBUTION,
} from '../graphql/mutations/charge.mutation';

export interface Charge {
  id?: number;
  copropertyId: number;
  name: string;
  description?: string;
  chargeType: 'CLEANING' | 'SECURITY' | 'MAINTENANCE' | 'ELECTRICITY' | 'WATER' | 'INSURANCE' | 'OTHER';
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'EXCEPTIONAL';
  totalAmount: number;
  distributionMethod: 'BY_SHARES' | 'BY_AREA' | 'EQUAL' | 'CUSTOM';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChargeDistribution {
  unitId: number;
  unitNumber: string;
  amount: number;
  shares?: number;
  area?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChargeService {
  private apollo = inject(Apollo);

  getAllCharges(): Observable<Charge[]> {
    return this.apollo
      .query<{ allCharges: Charge[] }>({
        query: GET_ALL_CHARGES,
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.allCharges));
  }

  getChargeById(id: number): Observable<Charge> {
    return this.apollo
      .query<{ chargeById: Charge }>({
        query: GET_CHARGE_BY_ID,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.chargeById));
  }

  getChargesByCoproperty(copropertyId: number): Observable<Charge[]> {
    return this.apollo
      .query<{ chargesByCoproperty: Charge[] }>({
        query: GET_CHARGES_BY_COPROPERTY,
        variables: { copropertyId },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data.chargesByCoproperty));
  }

  createCharge(charge: Charge): Observable<Charge> {
    return this.apollo
      .mutate<{ createCharge: Charge }>({
        mutation: CREATE_CHARGE,
        variables: { item: charge },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.createCharge));
  }

  updateCharge(charge: Charge): Observable<Charge> {
    return this.apollo
      .mutate<{ updateCharge: Charge }>({
        mutation: UPDATE_CHARGE,
        variables: { item: charge },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.updateCharge));
  }

  deleteCharge(id: number): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteCharge: boolean }>({
        mutation: DELETE_CHARGE,
        variables: { id },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.deleteCharge));
  }

  calculateDistribution(chargeId: number): Observable<ChargeDistribution[]> {
    return this.apollo
      .mutate<{ calculateChargeDistribution: ChargeDistribution[] }>({
        mutation: CALCULATE_CHARGE_DISTRIBUTION,
        variables: { chargeId },
        context: { serviceName: 'copropertyService' },
      })
      .pipe(map((result) => result.data!.calculateChargeDistribution));
  }
}
EOF
success "Charge service created"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  🎉 GraphQL Services Generated Successfully!        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

info "Generated Files:"
echo "  📁 GraphQL Queries:"
echo "     - $GRAPHQL_DIR/queries/unit.query.ts"
echo "     - $GRAPHQL_DIR/queries/maintenance.query.ts"
echo "     - $GRAPHQL_DIR/queries/charge.query.ts"
echo ""
echo "  📁 GraphQL Mutations:"
echo "     - $GRAPHQL_DIR/mutations/unit.mutation.ts"
echo "     - $GRAPHQL_DIR/mutations/maintenance.mutation.ts"
echo "     - $GRAPHQL_DIR/mutations/charge.mutation.ts"
echo ""
echo "  📁 Services:"
echo "     - $COPROPERTY_MODULE/services/unit.service.ts"
echo "     - $COPROPERTY_MODULE/services/maintenance.service.ts"
echo "     - $COPROPERTY_MODULE/services/charge.service.ts"
echo ""

info "Next Steps:"
echo "  1. Update type-config.ts to register GraphQL operations"
echo "  2. Implement backend GraphQL schema and resolvers"
echo "  3. Update components to use the new services"
echo "  4. Test CRUD operations end-to-end"
echo ""

success "Ready to integrate with components! 🚀"
