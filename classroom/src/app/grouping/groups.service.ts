import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AssignmentData } from '../assignment-data';
import { HttpErrorHandlerService, HandleError } from '../http-error-handler.service';

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
      {corpus: corpus, group_size: group_size})
      .pipe(catchError(this.handleError('getGroupsData', <GroupsData>{
        groups: [[]], grp_qualities: [], quality: 0
      })));
  }
}
