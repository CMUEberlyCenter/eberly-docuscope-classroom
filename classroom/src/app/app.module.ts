import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AngularSplitModule } from 'angular-split';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
// import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TagCloudModule } from 'angular-tag-cloud-module';
//import { TreeModule } from '@circlon/angular-tree-component';

import { AboutComponent } from './about/about.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BoxplotGraphComponent } from './boxplot-graph/boxplot-graph.component';
import { ComparePatternsTableComponent } from './compare-patterns-table/compare-patterns-table.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { GroupingComponent } from './grouping/grouping.component';
import { HeaderComponent } from './header/header.component';
import { MessagesComponent } from './messages/messages.component';
import { NavComponent } from './nav/nav.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { PatternsComponent } from './patterns/patterns.component';
import { PatternsTableComponent } from './patterns-table/patterns-table.component';
import { RankComponent } from './rank/rank.component';
import { RankGraphComponent } from './rank-graph/rank-graph.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { TextViewComponent } from './text-view/text-view.component';
import { CategorySelectComponent } from './category-select/category-select.component';

@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    MessagesComponent,
    BoxplotComponent,
    BoxplotGraphComponent,
    ScatterplotComponent,
    GroupingComponent,
    ReportComponent,
    TextViewComponent,
    RankGraphComponent,
    RankComponent,
    NavComponent,
    PatternsComponent,
    PatternsTableComponent,
    PageNotFoundComponent,
    HeaderComponent,
    ComparisonComponent,
    ComparePatternsTableComponent,
    CategorySelectComponent,
  ],
  entryComponents: [
    AboutComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularSplitModule.forRoot(),
    BrowserAnimationsModule,
    DragDropModule,
    FormsModule,
    GoogleChartsModule,
    HttpClientModule,
    NgxUiLoaderModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    // MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    TagCloudModule,
    //TreeModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
