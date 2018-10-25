import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RankGraphComponent } from './rank-graph.component';

describe('RankGraphComponent', () => {
  let component: RankGraphComponent;
  let fixture: ComponentFixture<RankGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RankGraphComponent ]
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
