import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BoxplotComponent } from './boxplot/boxplot.component';
import { GroupingComponent } from './grouping/grouping.component';
import { PatternsComponent } from './patterns/patterns.component';
import { RankComponent } from './rank/rank.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { TextViewComponent } from './text-view/text-view.component';

const routes: Routes = [
  { path: 'boxplot', component: BoxplotComponent },
  { path: 'groups', component: GroupingComponent },
  { path: 'patterns', component: PatternsComponent },
  { path: 'ranking', component: RankComponent },
  { path: 'report', component: ReportComponent },
  { path: 'scatterplot', component: ScatterplotComponent },
  { path: 'stv/:doc', component: TextViewComponent },
  { path: '', redirectTo: '/boxplot', pathMatch: 'full' }
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ]
})
export class AppRoutingModule { }
