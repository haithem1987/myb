import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCRUDComponent } from './userCRUD.component';

describe('UserCRUDComponent', () => {
  let component: UserCRUDComponent;
  let fixture: ComponentFixture<UserCRUDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCRUDComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCRUDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
