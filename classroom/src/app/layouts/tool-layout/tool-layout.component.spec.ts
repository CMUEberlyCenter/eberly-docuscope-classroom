import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToolLayoutComponent } from './tool-layout.component';

@Component({ selector: 'app-nav' })
class AppNavStubComponent {}

describe('ToolLayoutComponent', () => {
  let component: ToolLayoutComponent;
  let fixture: ComponentFixture<ToolLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToolLayoutComponent, AppNavStubComponent],
      imports: [RouterTestingModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ToolLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
