import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CategorySelectComponent } from './category-select.component';

@NgModule({
  declarations: [CategorySelectComponent],
  imports: [CommonModule, MatButtonModule, MatMenuModule],
  exports: [
    CategorySelectComponent,
    CommonModule,
    MatButtonModule,
    MatMenuModule,
  ],
})
export class CategorySelectModule {}
