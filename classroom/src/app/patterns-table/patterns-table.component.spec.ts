import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PatternsTableComponent } from './patterns-table.component';

describe('PatternsTableComponent', () => {
  let component: PatternsTableComponent;
  let fixture: ComponentFixture<PatternsTableComponent>;

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      declarations: [PatternsTableComponent],
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
    fixture = TestBed.createComponent(PatternsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
