import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { GroupingComponent } from './grouping/grouping.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PatternsComponent } from './patterns/patterns.component';
import { RankComponent } from './rank/rank.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { TextViewComponent } from './text-view/text-view.component';

export const routes: Routes = [
  { path: 'boxplot', component: BoxplotComponent },
  { path: 'bubble', component: BubbleChartComponent },
  { path: 'groups', component: GroupingComponent },
  { path: 'patterns', component: PatternsComponent },
  { path: 'frequency', component: RankComponent },
  { path: 'report', component: ReportComponent },
  { path: 'scatterplot', component: ScatterplotComponent },
  { path: 'stv/:doc', component: TextViewComponent },
  { path: 'mtv', component: ComparisonComponent },
  { path: '', redirectTo: '/boxplot', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
})
export class AppRoutingModule {}
