import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';

import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(async(() => {
    const activated_route_spy = jasmine.createSpyObj('activatedRoute', ['paramMap']);
    activated_route_spy.snapshot = jasmine.createSpyObj('snapshot', ['pmap']);
    activated_route_spy.snapshot.url = ['stub'];
    TestBed.configureTestingModule({
      imports: [ EasyUIModule ],
      declarations: [ NavComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: activated_route_spy }
      ],
      schemas: [ /*NO_ERRORS_SCHEMA*/ ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
