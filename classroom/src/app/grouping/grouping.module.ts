import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
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
