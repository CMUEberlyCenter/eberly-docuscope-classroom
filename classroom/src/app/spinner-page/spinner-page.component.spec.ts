import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SpinnerPageComponent } from './spinner-page.component';

describe('SpinnerPageComponent', () => {
  let component: SpinnerPageComponent;
  let fixture: ComponentFixture<SpinnerPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpinnerPageComponent],
      imports: [MatProgressSpinnerModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinnerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });
});
