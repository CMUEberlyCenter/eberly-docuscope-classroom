import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { PatternsTableComponent } from './patterns-table.component';

@NgModule({
  declarations: [PatternsTableComponent],
  imports: [CommonModule, MatSortModule, MatTableModule],
  exports: [
    CommonModule,
    PatternsTableComponent,
    MatSortModule,
    MatTableModule,
  ],
})
export class PatternsTableModule {}
