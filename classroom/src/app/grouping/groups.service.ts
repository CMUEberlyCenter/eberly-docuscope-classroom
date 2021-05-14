/* Service for querying server for groupings

This service get the groupings of students based on
maximizing difference between categories.
*/
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AssignmentData } from '../assignment-data';
import {
  HandleError,
  HttpErrorHandlerService,
} from '../http-error-handler.service';

/** JSON data returned by /groups */
export class GroupsData extends AssignmentData {
  groups: string[][]; // lists of lists of student names
  grp_qualities: number[]; // group quality statistics (unused)
  quality: number; // quality statistic (unused)
}

@Injectable({
  providedIn: 'root',
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

  /**
   * Get the groupings from the server.
   * @param corpus list of document UUID's
   * @param group_size the size of the groups to make (best effort)
   */
  getGroupsData(corpus: string[], group_size: number): Observable<GroupsData> {
    return this.http
      .post<GroupsData>(this.groups_server, { corpus, group_size })
      .pipe(
        catchError(
          this.handleError('getGroupsData', {
            groups: [[]],
            grp_qualities: [],
            quality: 0,
          } as GroupsData)
        )
      );
  }
}
