import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AssignmentData } from '../assignment-data';
import { HandleError, HttpErrorHandlerService } from '../http-error-handler.service';

export class GroupsData extends AssignmentData {
  groups: string[][];
  grp_qualities: number[];
  quality: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupsService {
  private handleError: HandleError;
  private groups_server = `${environment.backend_server}/groups`;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandlerService
  ) {
    this.handleError = httpErrorHandler.createHandleError('GroupsService');
  }

  getGroupsData(corpus: string[], group_size: number): Observable<GroupsData> {
    return this.http.post<GroupsData>(this.groups_server,
      {corpus, group_size})
      .pipe(catchError(this.handleError('getGroupsData', {
        groups: [[]], grp_qualities: [], quality: 0
      } as GroupsData)));
  }
}
