import { Component } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-spinner-page',
  templateUrl: './spinner-page.component.html',
  styleUrls: ['./spinner-page.component.scss'],
})
export class SpinnerPageComponent {}

export const SpinnerConfig: MatDialogConfig = {
  disableClose: true,
  role: 'alertdialog',
};
