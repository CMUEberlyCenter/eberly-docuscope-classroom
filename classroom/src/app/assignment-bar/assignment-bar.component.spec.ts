import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentBarComponent } from './assignment-bar.component';

describe('AssignmentBarComponent', () => {
  let component: AssignmentBarComponent;
  let fixture: ComponentFixture<AssignmentBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssignmentBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
