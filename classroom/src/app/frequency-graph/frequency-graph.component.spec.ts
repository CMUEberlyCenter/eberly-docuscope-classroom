/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FrequencyGraphComponent } from './frequency-graph.component';

const data = {
  categories: [
    {
      id: 'bogus',
      name: 'Bogus Data',
      description: 'A completely bogus category.',
      q1: 0.25,
      q2: 0.5,
      q3: 0.75,
      min: 0,
      max: 1,
      uifence: 0.9,
      lifence: 0.1,
    },
  ],
  data: [
    {
      id: 'i0',
      title: 'Text0',
      bogus: 0.6,
      total_words: 5,
      ownedby: 'student',
    },
    {
      id: 'i1',
      title: 'Text1',
      bogus: 0.5,
      total_words: 4,
      ownedby: 'instructor',
    },
    {
      id: 'i2',
      title: 'Text2',
      bogus: 0.4,
      total_words: 3,
      ownedby: 'student',
    },
  ],
};

@Component({
  selector: 'app-fake-rank-component',
  template: `<app-frequency-graph
    data=""
    category="${data.categories[0]}"
    unit="100"
  ></app-frequency-graph>`,
})
class TestRankComponent {
  @ViewChild(FrequencyGraphComponent)
  public rank: FrequencyGraphComponent;
}

describe('RankGraphComponent', () => {
  let component: TestRankComponent;
  let fixture: ComponentFixture<TestRankComponent>;

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      declarations: [FrequencyGraphComponent, TestRankComponent],
      imports: [
        MatCardModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule,
      ],
      schemas: [
        /* NO_ERRORS_SCHEMA*/
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestRankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeDefined();
    void expect(component.rank).toBeDefined();
  });

  it('ngOnChanges', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(() => component.rank.ngOnChanges()).not.toThrow();
    component.rank.category = null;
    fixture.detectChanges();
    void expect(() => component.rank.ngOnChanges()).not.toThrow();
    component.rank.data = null;
    fixture.detectChanges();
    void expect(() => component.rank.ngOnChanges()).not.toThrow();
  });

  it('median', async () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    await fixture.whenStable();
    return expect(component.rank.median).toBe(50);
  });
  it('max_value', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(component.rank.max_value).toBe(100);
    void expect(component.rank.max_value).toBe(100);
  });
  it('getValue', () => {
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(component.rank.getValue(data.data[0])).toBe(60);
  });
  it('left', () => expect(component.rank.left).toBe(10));
  it('right', () => expect(component.rank.right).toBe(240));
  it('x', () => expect(component.rank.x(0)).toBe(125));
  it('mean_start', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(component.rank.mean_start(30)).toBe(30);
    void expect(component.rank.mean_start(60)).toBe(50);
  });
  it('mean_width', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(component.rank.mean_width(30)).toBe(20);
    void expect(component.rank.mean_width(75)).toBe(25);
  });

  it('bar_tip', () => {
    component.rank.data = data;
    component.rank.category = data.categories[0];
    fixture.detectChanges();
    void expect(component.rank.bar_tip(20)).toBe(
      '20.00 which is about 30.00 less than the median of 50.00.'
    );
    void expect(component.rank.bar_tip(60)).toBe(
      '60.00 which is about 10.00 more than the median of 50.00.'
    );
  });

  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.rank.open('123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
    component.rank.open('');
    return expect(window.open).toHaveBeenCalledTimes(1);
  });
});
