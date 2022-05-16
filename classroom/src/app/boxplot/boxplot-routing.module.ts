import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoxplotComponent } from './boxplot.component';

const routes: Routes = [{ path: '', component: BoxplotComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BoxplotRoutingModule {}
