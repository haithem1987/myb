import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectClientComponent } from './selectClient.component';

describe('SelectClientComponent', () => {
  let component: SelectClientComponent;
  let fixture: ComponentFixture<SelectClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectClientComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
