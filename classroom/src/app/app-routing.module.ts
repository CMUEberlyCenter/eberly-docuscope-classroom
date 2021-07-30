import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { FrequencyComponent } from './frequency/frequency.component';
import { GroupingComponent } from './grouping/grouping.component';
import { ToolLayoutComponent } from './layouts/tool-layout/tool-layout.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PatternsComponent } from './patterns/patterns.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { TextViewComponent } from './text-view/text-view.component';

export const routes: Routes = [
  { path: 'stv/:doc', component: TextViewComponent },
  { path: 'mtv', component: ComparisonComponent },
  {
    path: '',
    component: ToolLayoutComponent,
    children: [
      { path: 'boxplot', component: BoxplotComponent },
      { path: 'bubble', component: BubbleChartComponent },
      { path: 'groups', component: GroupingComponent },
      { path: 'patterns', component: PatternsComponent },
      { path: 'frequency', component: FrequencyComponent },
      { path: 'report', component: ReportComponent },
      { path: 'scatterplot', component: ScatterplotComponent },
      { path: '**', component: PageNotFoundComponent },
    ],
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
})
export class AppRoutingModule {}
