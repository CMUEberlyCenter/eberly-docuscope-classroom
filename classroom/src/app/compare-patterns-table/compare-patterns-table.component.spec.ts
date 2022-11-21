import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
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
  }));

  beforeEach(() => {
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
