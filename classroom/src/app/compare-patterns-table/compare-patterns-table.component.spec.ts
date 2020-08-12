import { Component, ViewChild } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ComparePatternsTableComponent } from './compare-patterns-table.component';

const data = {};
@Component({
  selector: 'app-fake-compare-patterns-table',
  template: `<app-compare-patterns-table patterns="${data}" colors="['red','blue']"></app-compare-patterns-table>`
})
class TestComparePatternsTableComponent {
  @ViewChild(ComparePatternsTableComponent)
  public table: ComparePatternsTableComponent;
}

describe('ComparePatternsTableComponent', () => {
  let component: ComparePatternsTableComponent;
  let fixture: ComponentFixture<ComparePatternsTableComponent>;
  let tcomponent: TestComparePatternsTableComponent;
  let tfixture: ComponentFixture<TestComparePatternsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComparePatternsTableComponent, TestComparePatternsTableComponent ],
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparePatternsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create with colors', () => {
    tfixture = TestBed.createComponent(TestComparePatternsTableComponent);
    tcomponent = tfixture.componentInstance;
    tfixture.detectChanges();

    expect(tcomponent).toBeTruthy();
  });
});
