import { Component, ViewChild } from "@angular/core";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { asyncData, FAKE_COMMON_DICTIONARY } from "src/testing";
import { CommonDictionaryService } from "../common-dictionary.service";
import { BoxplotGraphComponent } from "./boxplot-graph.component";

const data = {
  categories: [
    {
      q1: 1,
      q2: 2,
      q3: 3,
      min: 0,
      max: 4,
      uifence: 3.5,
      lifence: 0.5,
      id: "bogus",
    },
  ],
  data: [
    {
      id: "over_outlier",
      title: "High Bogus Outlier",
      bogus: 4.5,
      total_words: 100,
      ownedby: "student",
    },
    {
      id: "under_outlier",
      title: "Low Bogus Outlier",
      bogus: 0.25,
      total_words: 100,
      ownedby: "student",
    },
    {
      id: "noutlier",
      title: "Non-Outlier",
      bogus: 2,
      total_words: 100,
      ownedby: "instructor",
    },
  ],
};

@Component({
  selector: "app-fake-boxplot-component",
  template: `<app-boxplot-graph
    boxplot="${data}"
    unit="100"
  ></app-boxplot-graph>`,
})
class TestBoxplotComponent {
  @ViewChild(BoxplotGraphComponent)
  public boxplot: BoxplotGraphComponent;
}

describe("BoxplotGraphComponent", () => {
  let component: TestBoxplotComponent;
  let fixture: ComponentFixture<TestBoxplotComponent>;

  beforeEach(
    waitForAsync(() => {
      const commonDictionaryService = jasmine.createSpyObj(
        "CommonDictionaryService",
        ["getJSON"]
      );
      commonDictionaryService.getJSON.and.returnValue(
        asyncData(FAKE_COMMON_DICTIONARY)
      );
      TestBed.configureTestingModule({
        imports: [
          MatSortModule,
          MatTableModule,
          MatTooltipModule,
          NoopAnimationsModule,
        ],
        declarations: [BoxplotGraphComponent, TestBoxplotComponent],
        schemas: [
          /* NO_ERRORS_SCHEMA*/
        ],
        providers: [
          {
            provide: CommonDictionaryService,
            useValue: commonDictionaryService,
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TestBoxplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeDefined();
    expect(component.boxplot).toBeDefined();
  });

  it("boxplot", () =>
    fixture.whenStable().then(() => {
      component.boxplot.boxplot = data;
      expect(component.boxplot.data).toEqual(data);
      component.boxplot.boxplot = null;
      expect(component.boxplot.data).toBeNull();
    }));

  it("get options", () => {
    expect(component.boxplot.options.width).toEqual(500);
    expect(component.boxplot.options.height).toEqual(50);
  });

  it("handle_selection", () =>
    fixture.whenStable().then(() => {
      component.boxplot.selected_category.emit = jasmine.createSpy("emit");
      component.boxplot.handle_selection(data.categories[0]);
      expect(component.boxplot.selected_category.emit).toHaveBeenCalledWith(
        data.categories[0]
      );
      component.boxplot.handle_selection(data.categories[0]);
      expect(component.boxplot.selected_category.emit).toHaveBeenCalledWith(
        null
      );
    }));

  it("scale", () => {
    expect(component.boxplot.scale(0.2)).toBe("20.00");
    expect(component.boxplot.scale(0.25678)).toBe("25.68");
    expect(component.boxplot.scale(0)).toBe("0.00");
  });

  it("open", () => {
    window.open = jasmine.createSpy("open");
    component.boxplot.open("stv/123");
    expect(window.open).toHaveBeenCalledWith("stv/123");
  });

  it("positions", () => {
    expect(component.boxplot.left).toBe(10);
    expect(component.boxplot.right).toBe(490);
    expect(component.boxplot.top).toBe(2);
    expect(component.boxplot.bottom).toBe(48);
  });

  it("scale_x", () => {
    component.boxplot.boxplot = data;
    expect(component.boxplot.scale_x(0)).toBe(10);
    expect(component.boxplot.scale_x(1000)).toBe(490);
  });

  it("scale_y", () => {
    expect(component.boxplot.scale_y(0)).toBe(2);
    expect(component.boxplot.scale_y(1)).toBe(48);
  });

  it("get_outliers", () =>
    fixture.whenStable().then(() => {
      component.boxplot.boxplot = data;
      const outlier0 = component.boxplot.get_outliers(data.categories[0])[0];
      expect(outlier0.id).toEqual(data.data[0].id);
      expect(outlier0.title).toEqual(data.data[0].title);
      expect(outlier0.value).toEqual(data.data[0].bogus);
      const outlier1 = component.boxplot.get_outliers(data.categories[0])[1];
      expect(outlier1.id).toEqual(data.data[1].id);
      expect(outlier1.title).toEqual(data.data[1].title);
      expect(outlier1.value).toEqual(data.data[1].bogus);
      // expect(component.boxplot.get_outliers(
      // {id: 'no_lat', name: "NULL", q1:0, q2:0, q3:0, min:0, max:1, lifence:0, uifence:0})).toEqual([]);
    }));

  it("ngAfterViewChecked", () =>
    fixture.whenStable().then(() => {
      component.boxplot.sort = null;
      expect(() => component.boxplot.ngAfterViewChecked()).not.toThrow();
    }));
});
