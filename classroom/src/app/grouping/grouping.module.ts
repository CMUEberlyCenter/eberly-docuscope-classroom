import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { GroupingRoutingModule } from './grouping-router.module';
import { GroupingComponent } from './grouping.component';

@NgModule({
  declarations: [GroupingComponent],
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    GroupingRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
  ],
  exports: [GroupingComponent],
})
export class GroupingModule {}
