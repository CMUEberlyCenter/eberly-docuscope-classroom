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
  template: `<app-rank-graph data="" category="${data.categories[0]}" unit="100"></app-rank-graph>`
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

  it('median', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    return fixture.whenStable().then(() => {
      expect(component.rank.median).toBe(50);
    });
  });
  it('max_value', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    expect(component.rank.max_value).toBe(100);
  });
  it('mean_start', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    expect(component.rank.mean_start(30)).toBe(30);
    expect(component.rank.mean_start(60)).toBe(50);
  });
  it('mean_width', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    expect(component.rank.mean_width(30)).toBe(20);
    expect(component.rank.mean_width(75)).toBe(25);
  });

  it('bar_tip', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    expect(component.rank.bar_tip(20)).toBe('20.00 which is about 30.00 less than the median of 50.00.');
    expect(component.rank.bar_tip(60)).toBe('60.00 which is about 10.00 more than the median of 50.00.');
  });

  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.rank.open('123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
    component.rank.open('');
    expect(window.open).toHaveBeenCalledTimes(1);
  });
});
