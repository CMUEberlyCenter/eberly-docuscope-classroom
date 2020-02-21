import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RankGraphComponent } from './rank-graph.component';

const data = {
  category: 'bogus_category',
  category_name: 'Bogus Category',
  median: 0.5,
  result: [
    {
      index: 'i0',
      text: 'Text0',
      value: 0.6,
      ownedby: 'student'
    },
    {
      index: 'i1',
      text: 'Text1',
      value: 0.5,
      ownedby: 'instructor'
    },
    {
      index: 'i2',
      text: 'Text2',
      value: 0.4,
      ownedby: 'student'
    },
  ]
};
@Component({
  selector: 'app-fake-rank-component',
  template: `<app-rank-graph rank_data="${data}" max_value="1"></app-rank-graph>`
})
class TestRankComponent {
  @ViewChild(RankGraphComponent)
  public rank: RankGraphComponent;
}

describe('RankGraphComponent', () => {
  let component: TestRankComponent;
  let fixture: ComponentFixture<TestRankComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RankGraphComponent, TestRankComponent ],
      imports: [
        MatCardModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      schemas: [ /*NO_ERRORS_SCHEMA*/ ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestRankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
    expect(component.rank).toBeDefined();
  });

  it('ngOnChanges', () => {
    component.rank.rank_data = data;
    fixture.detectChanges();
    component.rank.rank_data = null;
    fixture.detectChanges();
    expect(() => component.rank.ngOnChanges()).not.toThrow();
  });

  it('mean_start', () => {
    component.rank.rank_data = data;
    fixture.detectChanges();
    expect(component.rank.mean_start(0.3)).toBe(0.3);
    expect(component.rank.mean_start(0.6)).toBe(0.5);
  });

  it('mean_width', () => {
    component.rank.rank_data = data;
    fixture.detectChanges();
    expect(component.rank.mean_width(0.3)).toBe(0.2);
    expect(component.rank.mean_width(0.75)).toBe(0.25);
  });

  it('bar_tip', () => {
    component.rank.rank_data = data;
    fixture.detectChanges();
    expect(component.rank.bar_tip(0.2)).toBe('20.00 which is about 30.00 less than the median of 50.00.');
    expect(component.rank.bar_tip(0.6)).toBe('60.00 which is about 10.00 more than the median of 50.00.');
  });

  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.rank.open('123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
    component.rank.open('');
    expect(window.open).toHaveBeenCalledTimes(1);
  });
});
