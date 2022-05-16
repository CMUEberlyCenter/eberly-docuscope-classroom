/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let activated_route_spy; //: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(waitForAsync(() => {
    activated_route_spy = jasmine.createSpyObj('activatedRoute', ['paramMap']);
    activated_route_spy.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
    activated_route_spy.snapshot.url = ['stub'];
    activated_route_spy.snapshot.queryParamMap = new Map();
    void TestBed.configureTestingModule({
      imports: [
        FormsModule,
        RouterTestingModule,
        MatTabsModule,
        MatTooltipModule,
      ],
      declarations: [NavComponent],
      providers: [{ provide: ActivatedRoute, useValue: activated_route_spy }],
      schemas: [
        /* NO_ERRORS_SCHEMA*/
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });

  it('is_instructor', () => {
    void expect(component.is_instructor()).toBe(false);
    activated_route_spy.snapshot.queryParamMap.set('roles', 'Student');
    void expect(component.is_instructor()).toBe(false);
    activated_route_spy.snapshot.queryParamMap.set('roles', 'Instructor');
    void expect(component.is_instructor()).toBe(true);
    activated_route_spy.snapshot.queryParamMap = undefined;
    void expect(component.is_instructor()).toBe(false);
  });
});
