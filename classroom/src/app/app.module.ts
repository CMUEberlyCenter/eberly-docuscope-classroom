import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EasyUIModule } from 'ng-easyui/components/easyui/easyui.module';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppSettingsService } from './app-settings.service';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { BoxplotGraphComponent } from './boxplot-graph/boxplot-graph.component';
import { CorpusDetailComponent } from './corpus-detail/corpus-detail.component';
import { GroupingComponent } from './grouping/grouping.component';
import { MessagesComponent } from './messages/messages.component';
import { ModalComponent } from './modal/modal.component';
import { NavComponent } from './nav/nav.component';
import { RankComponent } from './rank/rank.component';
import { RankGraphComponent } from './rank-graph/rank-graph.component';
import { ReportComponent } from './report/report.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { ScatterplotGraphComponent } from './scatterplot-graph/scatterplot-graph.component';
import { TextViewComponent } from './text-view/text-view.component';

const appInitializerFn = (appConfig: AppSettingsService) => {
  return () => appConfig.loadSettings();
};

@NgModule({
  declarations: [
    AppComponent,
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
    RankComponent,
    NavComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    EasyUIModule,
    AppRoutingModule
  ],
  providers: [
    AppSettingsService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppSettingsService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
