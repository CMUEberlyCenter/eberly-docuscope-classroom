/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ToolLayoutComponent } from './tool-layout.component';

@Component({ selector: 'app-nav' })
class AppNavStubComponent {}

describe('ToolLayoutComponent', () => {
  let component: ToolLayoutComponent;
  let fixture: ComponentFixture<ToolLayoutComponent>;
  const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [
    'paramMap',
  ]);
  activatedRouteSpy.snapshot = jasmine.createSpyObj('snapshot', ['paramMap']);
  activatedRouteSpy.snapshot.queryParamMap = jasmine.createSpyObj(
    'queryParamMap',
    ['get', 'has']
  );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ToolLayoutComponent, AppNavStubComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: ActivatedRoute, useValue: activatedRouteSpy }],
    }).compileComponents();
    fixture = TestBed.createComponent(ToolLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    activatedRouteSpy.snapshot.queryParamMap.has.and.returnValue(false);
  });

  it('should create', async () => {
    await expect(component).toBeTruthy();
  });

  it('is_instructor null', () => {
    expect(component.is_instructor()).toBeFalse();
  });

  it('is_instructor false', () => {
    activatedRouteSpy.snapshot.queryParamMap.has.and.returnValue(true);
    activatedRouteSpy.snapshot.queryParamMap.get.and.returnValue('Student');
    expect(component.is_instructor()).toBeFalse();
  });
  it('is_instructor true', () => {
    activatedRouteSpy.snapshot.queryParamMap.has.and.returnValue(true);
    activatedRouteSpy.snapshot.queryParamMap.get.and.returnValue('Instructor');
    expect(component.is_instructor()).toBeTrue();
  });
});
