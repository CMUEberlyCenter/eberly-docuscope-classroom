import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PatternsTableComponent } from './patterns-table.component';

describe('PatternsTableComponent', () => {
  let component: PatternsTableComponent;
  let fixture: ComponentFixture<PatternsTableComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
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
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PatternsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
