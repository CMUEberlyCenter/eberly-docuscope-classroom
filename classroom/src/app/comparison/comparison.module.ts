import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { AngularSplitModule } from 'angular-split';
import { ComparePatternsTableComponent } from '../compare-patterns-table/compare-patterns-table.component';
import { ComparisonRoutingModule } from './comparison-router.module';
import { ComparisonComponent } from './comparison.component';

@NgModule({
  declarations: [ComparisonComponent, ComparePatternsTableComponent],
  imports: [
    AngularSplitModule,
    CommonModule,
    ComparisonRoutingModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    MatTreeModule,
  ],
  exports: [
    CommonModule,
    ComparisonComponent,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatSortModule,
    MatTreeModule,
    MatTableModule,
  ],
})
export class ComparisonModule {}
