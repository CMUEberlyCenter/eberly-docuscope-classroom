import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolLayoutComponent } from './tool-layout.component';

describe('ToolLayoutComponent', () => {
  let component: ToolLayoutComponent;
  let fixture: ComponentFixture<ToolLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
