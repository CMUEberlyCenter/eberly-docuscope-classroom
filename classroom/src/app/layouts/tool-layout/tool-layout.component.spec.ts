/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterModule,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToolLayoutComponent } from './tool-layout.component';
import { routes } from '../../app-routing.module';

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  template: '',
})
class AppNavStubComponent {}

describe('ToolLayoutComponent', () => {
  let component: ToolLayoutComponent;
  let fixture: ComponentFixture<ToolLayoutComponent>;
  let queryParams: Record<string, string> = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolLayoutComponent, RouterModule.forRoot(routes)],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
                has: (key: string) => key in queryParams,
              },
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ToolLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // activatedRouteSpy.snapshot.queryParamMap.has.mockReturnValue(false);
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  it('is_instructor null', () => {
    expect(component.is_instructor()).toBe(false);
  });

  it('is_instructor false', () => {
    queryParams['roles'] = 'Student';
    // activatedRouteSpy.snapshot.queryParamMap.has.mockReturnValue(true);
    // activatedRouteSpy.snapshot.queryParamMap.get.mockReturnValue('Student');
    expect(component.is_instructor()).toBe(false);
  });
  it('is_instructor true', () => {
    queryParams['roles'] = 'Instructor';
    // activatedRouteSpy.snapshot.queryParamMap.has.mockReturnValue(true);
    // activatedRouteSpy.snapshot.queryParamMap.get.mockReturnValue('Instructor');
    expect(component.is_instructor()).toBe(true);
  });
});
