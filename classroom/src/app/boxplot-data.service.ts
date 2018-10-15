import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { MessageService } from './message.service';
import { CONFIG } from './app-settings';
import { Corpus } from './corpus';
import { BoxplotData, makeBoxplotSchema, RankData, makeRankedListSchema, ScatterplotData, makeScatterplotSchema, GroupsData, makeGroupsSchema  } from './boxplot-data';

@Injectable({
  providedIn: 'root'
})
export class BoxplotDataService {
  private boxplot_server: string = CONFIG.backend_server+'/boxplot_data';
  private rank_server: string = CONFIG.backend_server+'/ranked_list';
  private scatter_server: string = CONFIG.backend_server+'/scatterplot_data';
  private groups_server: string = CONFIG.backend_server+'/groups';

  constructor(private http: HttpClient,
              private messageService: MessageService) { }

  private handleError(error: HttpErrorResponse) {
    return throwError('Something bad happened');
  }

  getBoxPlotData(corpus: Corpus): Observable<BoxplotData> {
    let bp_query = makeBoxplotSchema(corpus);
    return this.http.post<BoxplotData>(this.boxplot_server, bp_query)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRankedList(corpus: Corpus, sort_by: string): Observable<RankData> {
    let rank_query = makeRankedListSchema(corpus, sort_by);
    return this.http.post<RankData>(this.rank_server, rank_query)
      .pipe(
        catchError(this.handleError)
      );
  }

  getScatterPlotData(corpus: Corpus, x:string, y:string): Observable<ScatterplotData> {
    let scatter_query = makeScatterplotSchema(corpus, x, y);
    return this.http.post<ScatterplotData>(this.scatter_server, scatter_query)
      .pipe(
        catchError(this.handleError)
      );
  }

  getGroupsData(corpus: Corpus, group_size:number): Observable<GroupsData> {
    let groups_query = makeGroupsSchema(corpus, group_size);
    return this.http.post<GroupsData>(this.groups_server, groups_query)
      .pipe(catchError(this.handleError));
  }
}
