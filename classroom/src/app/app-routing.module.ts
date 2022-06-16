import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ToolLayoutComponent } from './layouts/tool-layout/tool-layout.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: 'stv/:doc',
    loadChildren: () =>
      import('./text-view/text-view.module').then((m) => m.TextViewModule),
  },
  {
    path: 'mtv',
    loadChildren: () =>
      import('./comparison/comparison.module').then((m) => m.ComparisonModule),
  },
  {
    path: '',
    component: ToolLayoutComponent,
    children: [
      {
        path: 'boxplot',
        loadChildren: () =>
          import('./boxplot/boxplot.module').then((m) => m.BoxplotModule),
      },
      {
        path: 'bubble',
        loadChildren: () =>
          import('./bubble-chart/bubble-chart.module').then(
            (m) => m.BubbleChartModule
          ),
      },
      {
        path: 'groups',
        loadChildren: () =>
          import('./grouping/grouping.module').then((m) => m.GroupingModule),
      },
      {
        path: 'patterns',
        loadChildren: () =>
          import('./patterns/patterns.module').then((m) => m.PatternsModule),
      },
      {
        path: 'frequency',
        loadChildren: () =>
          import('./frequency/frequency.module').then((m) => m.FrequencyModule),
      },
      {
        path: 'report',
        loadChildren: () =>
          import('./report/report.module').then((m) => m.ReportModule),
      },
      {
        path: 'scatterplot',
        loadChildren: () =>
          import('./scatterplot/scatterplot.module').then(
            (m) => m.ScatterplotModule
          ),
      },
      // { path: '', redirectTo: '/boxplot', pathMatch: 'full' }, // Does not work.
      { path: '**', component: PageNotFoundComponent },
    ],
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes)],
})
export class AppRoutingModule {}
