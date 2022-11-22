import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BoxplotRoutingModule } from './boxplot-routing.module';
import { BoxplotComponent } from './boxplot.component';

@NgModule({
  declarations: [BoxplotComponent],
  imports: [
    BoxplotRoutingModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTreeModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  exports: [CommonModule, BoxplotComponent],
})
export class BoxplotModule {}
