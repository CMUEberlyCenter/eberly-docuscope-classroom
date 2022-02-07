import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GoogleChartsModule } from 'angular-google-charts';
import { AngularSplitModule } from 'angular-split';
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';
import { CategorySelectComponent } from './category-select/category-select.component';
import { ComparePatternsTableComponent } from './compare-patterns-table/compare-patterns-table.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { FrequencyGraphComponent } from './frequency-graph/frequency-graph.component';
import { FrequencyComponent } from './frequency/frequency.component';
import { GroupingComponent } from './grouping/grouping.component';
import { HeaderComponent } from './header/header.component';
import { ToolLayoutComponent } from './layouts/tool-layout/tool-layout.component';
import { NavComponent } from './nav/nav.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PatternsTableComponent } from './patterns-table/patterns-table.component';
import { PatternsComponent } from './patterns/patterns.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { SunburstChartComponent } from './sunburst-chart/sunburst-chart.component';
import { TextViewComponent } from './text-view/text-view.component';
import { SpinnerPageComponent } from './spinner-page/spinner-page.component';

@NgModule({
  declarations: [
    AboutComponent,
    AppComponent,
    BoxplotComponent,
    BubbleChartComponent,
    CategorySelectComponent,
    ComparePatternsTableComponent,
    ComparisonComponent,
    GroupingComponent,
    HeaderComponent,
    NavComponent,
    PageNotFoundComponent,
    PatternsComponent,
    PatternsTableComponent,
    FrequencyComponent,
    FrequencyGraphComponent,
    ReportComponent,
    ScatterplotComponent,
    SunburstChartComponent,
    TextViewComponent,
    ToolLayoutComponent,
    SpinnerPageComponent,
  ],
  entryComponents: [AboutComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularSplitModule,
    BrowserAnimationsModule,
    DragDropModule,
    FormsModule,
    GoogleChartsModule,
    HttpClientModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatTreeModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
