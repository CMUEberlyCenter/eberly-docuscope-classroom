import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, tap, publishReplay, refCount, take } from 'rxjs/operators';
import { MessageService } from './message.service';
import { AppSettingsService } from './app-settings.service';
import { Corpus } from './corpus';
import { BoxplotData, makeBoxplotSchema, RankData, makeRankedListSchema,
         ScatterplotData, makeScatterplotSchema, GroupsData,
         makeGroupsSchema } from './boxplot-data';

@Injectable({
  providedIn: 'root'
})
export class BoxplotDataService {
  private boxplot_server = `${this.env.config.backend_server}/boxplot_data`;
  private boxplot_data: Observable<BoxplotData>;
  private rank_server = `${this.env.config.backend_server}/ranked_list`;
  private rank_data: Map<string, Observable<RankData>> = new Map<string, Observable<RankData>>();
  private scatter_server = `${this.env.config.backend_server}/scatterplot_data`;
  private scatterplot_data: Map<string, Map<string, Observable<ScatterplotData>>> =
    new Map<string, Map<string, Observable<ScatterplotData>>>();
  private groups_server = `${this.env.config.backend_server}/groups`;

  constructor(private http: HttpClient,
              private env: AppSettingsService,
              private messageService: MessageService) { }

  private handleError(error: HttpErrorResponse) {
    console.error(error);
    alert(`${error.error.message}`);
    return throwError('Something bad happened');
  }

  getBoxPlotData(corpus: Corpus): Observable<BoxplotData> {
    if (this.boxplot_data) {
      console.log(this.boxplot_data);
      this.messageService.add('Retrieved Box Plot data from cache.');
      return this.boxplot_data;
    } else {
      this.messageService.add('Going to retrieve Box Plot data from server, please wait.');
      const bp_query = makeBoxplotSchema(corpus);
      this.boxplot_data = this.http.post<BoxplotData>(this.boxplot_server, bp_query)
        .pipe(
          publishReplay(1),
          refCount(),
          tap(data => this.messageService.add('Box Plot data retrieval successful.')),
          catchError(this.handleError)
        );
      return this.boxplot_data;
    }
  }

  getRankedList(corpus: Corpus, sort_by: string): Observable<RankData> {
    if (!this.rank_data.has(sort_by)) {
      const rank_query = makeRankedListSchema(corpus, sort_by);
      this.rank_data.set(sort_by, this.http.post<RankData>(this.rank_server, rank_query)
                         .pipe(
                           publishReplay(1),
                           refCount(),
                           catchError(this.handleError)
                         ));
    }
    return this.rank_data.get(sort_by);
  }

  getScatterPlotData(corpus: Corpus, x: string, y: string): Observable<ScatterplotData> {
    if (!this.scatterplot_data.has(x)) {
      this.scatterplot_data.set(x, new Map<string, Observable<ScatterplotData>>());
    }
    const x_map = this.scatterplot_data.get(x);
    if (!x_map.has(y)) {
      const scatter_query = makeScatterplotSchema(corpus, x, y);
      x_map.set(y,
                this.http.post<ScatterplotData>(this.scatter_server, scatter_query)
                .pipe(
                  publishReplay(1),
                  refCount(),
                  catchError(this.handleError)
                ));
    }
    return x_map.get(y);
  }

  getGroupsData(corpus: Corpus, group_size: number): Observable<GroupsData> {
    const groups_query = makeGroupsSchema(corpus, group_size);
    return this.http.post<GroupsData>(this.groups_server, groups_query)
      .pipe(catchError(this.handleError));
  }
}
