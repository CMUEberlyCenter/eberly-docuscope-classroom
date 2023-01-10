import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PatternsTableComponent } from './patterns-table.component';

describe('PatternsTableComponent', () => {
  let component: PatternsTableComponent;
  let fixture: ComponentFixture<PatternsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
    fixture = TestBed.createComponent(PatternsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
