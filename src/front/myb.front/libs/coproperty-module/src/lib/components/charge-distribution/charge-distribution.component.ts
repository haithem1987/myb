import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface Unit {
  id: string;
  unitNumber: string;
  area: number;
  shares: number;
  owners: any[];
}

interface DistributionPreview {
  unitId: string;
  unitNumber: string;
  ownerName: string;
  area: number;
  shares: number;
  amount: number;
  percentage: number;
}

enum DistributionMethod {
  ByShares = 'shares',
  ByArea = 'area',
  Equal = 'equal',
  Custom = 'custom',
}

@Component({
  selector: 'myb-charge-distribution',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './charge-distribution.component.html',
  styleUrls: ['./charge-distribution.component.scss'],
})
export class ChargeDistributionComponent implements OnInit {
  chargeForm: FormGroup;
  units: Unit[] = [];
  distributionPreview: DistributionPreview[] = [];
  showPreview: boolean = false;

  DistributionMethod = DistributionMethod;
  selectedMethod: DistributionMethod = DistributionMethod.ByShares;

  chargeTypes = ['General', 'Special', 'Works'];
  frequencies = ['Monthly', 'Quarterly', 'Annually'];

  totalShares: number = 0;
  totalArea: number = 0;
  totalAmount: number = 0;

  constructor(private fb: FormBuilder) {
    this.chargeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      chargeType: ['General', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      frequency: ['Monthly', Validators.required],
      coproperty: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    // TODO: Implement GraphQL query to fetch units
    // Mock data
    this.units = [
      { id: '1', unitNumber: 'A101', area: 75.5, shares: 500, owners: [{ firstName: 'Jean', lastName: 'Dupont' }] },
      { id: '2', unitNumber: 'A102', area: 65.0, shares: 450, owners: [] },
      { id: '3', unitNumber: 'B201', area: 100.0, shares: 650, owners: [{ firstName: 'Marie', lastName: 'Martin' }] },
      { id: '4', unitNumber: 'B202', area: 85.5, shares: 550, owners: [] },
    ];

    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalShares = this.units.reduce((sum, u) => sum + u.shares, 0);
    this.totalArea = this.units.reduce((sum, u) => sum + u.area, 0);
  }

  calculateDistribution(): void {
    const totalAmount = this.chargeForm.get('totalAmount')?.value;

    if (!totalAmount || totalAmount <= 0) {
      alert('Please enter a valid total amount');
      return;
    }

    this.totalAmount = totalAmount;
    this.distributionPreview = [];

    switch (this.selectedMethod) {
      case DistributionMethod.ByShares:
        this.distributionByShares(totalAmount);
        break;
      case DistributionMethod.ByArea:
        this.distributionByArea(totalAmount);
        break;
      case DistributionMethod.Equal:
        this.distributionEqual(totalAmount);
        break;
      case DistributionMethod.Custom:
        this.initializeCustomDistribution(totalAmount);
        break;
    }

    this.showPreview = true;
  }

  private distributionByShares(totalAmount: number): void {
    this.units.forEach((unit) => {
      const percentage = (unit.shares / this.totalShares) * 100;
      const amount = (totalAmount * unit.shares) / this.totalShares;

      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerName: unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Unassigned',
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionByArea(totalAmount: number): void {
    this.units.forEach((unit) => {
      const percentage = (unit.area / this.totalArea) * 100;
      const amount = (totalAmount * unit.area) / this.totalArea;

      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerName: unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Unassigned',
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private distributionEqual(totalAmount: number): void {
    const amount = totalAmount / this.units.length;
    const percentage = 100 / this.units.length;

    this.units.forEach((unit) => {
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerName: unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Unassigned',
        area: unit.area,
        shares: unit.shares,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      });
    });
  }

  private initializeCustomDistribution(totalAmount: number): void {
    this.units.forEach((unit) => {
      this.distributionPreview.push({
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        ownerName: unit.owners.length > 0 ? `${unit.owners[0].firstName} ${unit.owners[0].lastName}` : 'Unassigned',
        area: unit.area,
        shares: unit.shares,
        amount: 0,
        percentage: 0,
      });
    });
  }

  updateCustomAmount(index: number, amount: number): void {
    if (this.distributionPreview[index]) {
      this.distributionPreview[index].amount = amount;
      this.recalculatePercentages();
    }
  }

  private recalculatePercentages(): void {
    const total = this.distributionPreview.reduce((sum, item) => sum + item.amount, 0);
    this.distributionPreview.forEach((item) => {
      item.percentage = total > 0 ? (item.amount / total) * 100 : 0;
    });
  }

  getTotalAmount(): number {
    return this.distributionPreview.reduce((sum, item) => sum + item.amount, 0);
  }

  saveDistribution(): void {
    if (this.chargeForm.valid && this.distributionPreview.length > 0) {
      // TODO: Implement GraphQL mutation to save charge and distributions
      alert('Charge distribution saved successfully');
    }
  }

  reset(): void {
    this.chargeForm.reset({ chargeType: 'General', frequency: 'Monthly' });
    this.distributionPreview = [];
    this.showPreview = false;
  }
}
