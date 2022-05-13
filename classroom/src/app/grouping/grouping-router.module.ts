import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupingComponent } from './grouping.component';

const routes: Routes = [{ path: '', component: GroupingComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupingRoutingModule {}
