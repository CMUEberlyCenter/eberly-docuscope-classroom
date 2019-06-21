import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BoxplotGraphComponent } from './boxplot-graph/boxplot-graph.component';
import { GroupingComponent } from './grouping/grouping.component';
import { MessagesComponent } from './messages/messages.component';
import { NavComponent } from './nav/nav.component';
import { RankComponent } from './rank/rank.component';
import { RankGraphComponent } from './rank-graph/rank-graph.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { ScatterplotGraphComponent } from './scatterplot-graph/scatterplot-graph.component';
import { TextViewComponent } from './text-view/text-view.component';

@NgModule({
  declarations: [
    AppComponent,
    MessagesComponent,
    BoxplotComponent,
    BoxplotGraphComponent,
    ScatterplotComponent,
    GroupingComponent,
    ReportComponent,
    TextViewComponent,
    ScatterplotGraphComponent,
    RankGraphComponent,
    RankComponent,
    NavComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    EasyUIModule,
    MatBadgeModule,
    MatCardModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatListModule,
    MatTabsModule,
    MatTooltipModule
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
