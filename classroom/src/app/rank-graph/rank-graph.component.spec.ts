import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RankGraphComponent } from './rank-graph.component';

const data = {
  categories: [{
    id: 'bogus',
    name: 'Bogus Data',
    description: 'A completely bogus category.',
    q1: 0.25, q2: 0.5, q3: 0.75, min: 0, max: 1,
    uifence: 0.9, lifence: 0.1,
  }],
  data: [
    {
      id: 'i0',
      title: 'Text0',
      bogus: 0.6,
      total_words: 5,
      ownedby: 'student'
    },
    {
      id: 'i1',
      title: 'Text1',
      bogus: 0.5,
      total_words: 4,
      ownedby: 'instructor'
    },
    {
      id: 'i2',
      title: 'Text2',
      bogus: 0.4,
      total_words: 3,
      ownedby: 'student'
    },
  ]
};

@Component({
  selector: 'app-fake-rank-component',
  template: `<app-rank-graph data="${data}" category="bogus" unit="100"></app-rank-graph>`
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
      schemas: [ /* NO_ERRORS_SCHEMA*/ ]
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
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    component.rank.category = null;
    fixture.detectChanges();
    component.rank.data = null;
    fixture.detectChanges();
    expect(() => component.rank.ngOnChanges()).not.toThrow();
  });

  it('median', () => { expect(component.rank.median).toBe(0.5); });
  it('max_value', () => { expect(component.rank.max_value).toBe(1); });
  it('mean_start', () => {
    //component.rank.data = data;
    expect(component.rank.mean_start(0.3)).toBe(0.3);
    expect(component.rank.mean_start(0.6)).toBe(0.5);
  });
  it('mean_width', () => {
    //component.rank.data = data;
    expect(component.rank.mean_width(0.3)).toBe(0.2);
    expect(component.rank.mean_width(0.75)).toBe(0.25);
  });

  it('bar_tip', () => {
    //component.rank.data = data;
    //fixture.detectChanges();
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
