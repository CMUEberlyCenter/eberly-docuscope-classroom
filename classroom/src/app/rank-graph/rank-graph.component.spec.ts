import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';

import { RankGraphComponent } from './rank-graph.component';

describe('RankGraphComponent', () => {
  let component: RankGraphComponent;
  let fixture: ComponentFixture<RankGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RankGraphComponent ],
      imports: [ EasyUIModule ],
      schemas: [ /*NO_ERRORS_SCHEMA*/ ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RankGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
