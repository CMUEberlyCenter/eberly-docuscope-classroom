import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { ReportRoutingModule } from './report-routing.module';
import { ReportComponent } from './report.component';

@NgModule({
  declarations: [ReportComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReportRoutingModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  exports: [ReportComponent],
})
export class ReportModule {}
