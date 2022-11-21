import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
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
