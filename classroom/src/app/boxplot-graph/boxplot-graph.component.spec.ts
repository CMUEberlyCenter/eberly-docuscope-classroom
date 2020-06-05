import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BoxplotGraphComponent } from './boxplot-graph.component';

const data = {
  categories: [{q1: 1, q2: 2, q3: 3, min: 0, max: 4,
    uifence: 3.5, lifence: 0.5,
    id: 'bogus', name: 'Bogus Data'}],
  data: [{id: 'outlier', title: 'Outlier', bogus: 4.5, total_words: 100, ownedby: 'student'}]
};

@Component({
  selector: 'app-fake-boxplot-component',
  template: `<app-boxplot-graph boxplot="${data}" max_value="1"></app-boxplot-graph>`
})
class TestBoxplotComponent {
  @ViewChild(BoxplotGraphComponent)
  public boxplot: BoxplotGraphComponent;
}

describe('BoxplotGraphComponent', () => {
  let component: TestBoxplotComponent;
  let fixture: ComponentFixture<TestBoxplotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      declarations: [ BoxplotGraphComponent, TestBoxplotComponent ],
      schemas: [ /* NO_ERRORS_SCHEMA*/ ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestBoxplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
    expect(component.boxplot).toBeDefined();
  });

  it('boxplot', () => fixture.whenStable().then(() => {
    component.boxplot.boxplot = data;
    expect(component.boxplot.data).toEqual(data);
    component.boxplot.boxplot = null;
    expect(component.boxplot.data).toBeNull();
  }));

  it('get options', () => {
    expect(component.boxplot.options).toEqual({ width: 500, height: 50 });
  });

  it('handle_selection', () => fixture.whenStable().then(() => {
    component.boxplot.selected_category.emit = jasmine.createSpy('emit');
    component.boxplot.handle_selection(data.categories[0]);
    expect(component.boxplot.selected_category.emit).toHaveBeenCalledWith('bogus');
    component.boxplot.handle_selection(data.categories[0]);
    expect(component.boxplot.selected_category.emit).toHaveBeenCalledWith('');
  }));

  it('percent', () => {
    expect(component.boxplot.percent(.2)).toBe('20.00');
    expect(component.boxplot.percent(.25678)).toBe('25.68');
    expect(component.boxplot.percent(0)).toBe('0.00');
  });

  it('open', () => {
    window.open = jasmine.createSpy('open');
    component.boxplot.open('stv/123');
    expect(window.open).toHaveBeenCalledWith('stv/123');
  });

  it('scale_x', () => {
    expect(component.boxplot.scale_x(0)).toBe(10);
    expect(component.boxplot.scale_x(1)).toBe(280);
  });

  it('scale_y', () => {
    expect(component.boxplot.scale_y(0)).toBe(2);
    expect(component.boxplot.scale_y(1)).toBe(26);
  });

  it('get_outliers', () => fixture.whenStable().then(() => {
    // component.boxplot.#ds_data = data;
    expect(component.boxplot.get_outliers(data.categories[0])).toEqual(
      [{id: data.data[0].id, title: data.data[0].title, value: data.data[0].bogus}]);
    // expect(component.boxplot.get_outliers(
    // {id: 'no_lat', name: "NULL", q1:0, q2:0, q3:0, min:0, max:1, lifence:0, uifence:0})).toEqual([]);
  }));

  it('ngAfterViewChecked', () => fixture.whenStable().then(() => {
    component.boxplot.sort = null;
    expect(() => component.boxplot.ngAfterViewChecked()).not.toThrow();
  }));
});
