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
  let activated_route_spy;

  beforeEach(
    waitForAsync(() => {
      activated_route_spy = jasmine.createSpyObj('activatedRoute', [
        'paramMap',
      ]);
      activated_route_spy.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
      activated_route_spy.snapshot.url = ['stub'];
      activated_route_spy.snapshot.queryParamMap = new Map();
      TestBed.configureTestingModule({
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
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is_current', () => {
    expect(component.is_current('')).toBe(false);
    expect(component.is_current('/stub')).toBe(true);
    expect(component.is_current('/foo/bar')).toBe(false);
  });

  it('is_instructor', () => {
    expect(component.is_instructor()).toBe(false);
    activated_route_spy.snapshot.queryParamMap.set('roles', 'Student');
    expect(component.is_instructor()).toBe(false);
    activated_route_spy.snapshot.queryParamMap.set('roles', 'Instructor');
    expect(component.is_instructor()).toBe(true);
  });
});
