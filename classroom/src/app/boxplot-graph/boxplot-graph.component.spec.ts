import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxplotGraphComponent } from './boxplot-graph.component';

describe('BoxplotGraphComponent', () => {
  let component: BoxplotGraphComponent;
  let fixture: ComponentFixture<BoxplotGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoxplotGraphComponent ]
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
