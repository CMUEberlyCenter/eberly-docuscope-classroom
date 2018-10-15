import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CorpusComponent } from './corpus/corpus.component';
import { CorpusDetailComponent } from './corpus-detail/corpus-detail.component';
import { MessagesComponent } from './messages/messages.component';
import { AppRoutingModule } from './app-routing.module';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BoxplotGraphComponent } from './boxplot-graph/boxplot-graph.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { GroupingComponent } from './grouping/grouping.component';
import { ReportComponent } from './report/report.component';
import { TextViewComponent } from './text-view/text-view.component';
import { ScatterplotGraphComponent } from './scatterplot-graph/scatterplot-graph.component';
import { RankGraphComponent } from './rank-graph/rank-graph.component';
import { RankComponent } from './rank/rank.component';

@NgModule({
  declarations: [
    AppComponent,
    CorpusComponent,
    CorpusDetailComponent,
    MessagesComponent,
    BoxplotComponent,
    BoxplotGraphComponent,
    ScatterplotComponent,
    GroupingComponent,
    ReportComponent,
    TextViewComponent,
    ScatterplotGraphComponent,
    RankGraphComponent,
    RankComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
