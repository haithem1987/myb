import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserModelComponent } from './UserModel.component';

describe('UserModelComponent', () => {
  let component: UserModelComponent;
  let fixture: ComponentFixture<UserModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
