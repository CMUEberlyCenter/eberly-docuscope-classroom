import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
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
