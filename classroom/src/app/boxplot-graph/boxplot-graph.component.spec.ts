import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';

import { BoxplotGraphComponent } from './boxplot-graph.component';

describe('BoxplotGraphComponent', () => {
  let component: BoxplotGraphComponent;
  let fixture: ComponentFixture<BoxplotGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ EasyUIModule ],
      declarations: [ BoxplotGraphComponent ],
      schemas: [ /*NO_ERRORS_SCHEMA*/ ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoxplotGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
