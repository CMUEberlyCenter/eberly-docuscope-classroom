import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComparePatternsTableComponent } from './compare-patterns-table.component';

@Component({
  selector: 'app-fake-compare-patterns-table',
  // prettier-ignore
  template: `<app-compare-patterns-table
  patterns="{}"
  colors="['red','blue']"
></app-compare-patterns-table>
`,
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ComparePatternsTableComponent,
        TestComparePatternsTableComponent,
      ],
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ComparePatternsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    return expect(component).toBeTruthy();
  });

  it('should create with colors', () => {
    tfixture = TestBed.createComponent(TestComparePatternsTableComponent);
    tcomponent = tfixture.componentInstance;
    tfixture.detectChanges();

    return expect(tcomponent).toBeTruthy();
  });
});
