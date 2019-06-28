import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import { MessageService } from './message.service';

export interface AssignmentData {
  course: string;
  assignment: string;
  intro: string;
  stv_intro: string;
}

const DefaultAssignmentData: AssignmentData = {
  course: 'Course Name',
  assignment: 'Assignment',
  intro: `This document is you own personalized report of how your language and
writing choices have been analyzed by the DocuScope text analysis tool. You
will use this report to undrestand how you expressed the core features of this
assignment and to compare your expression with a peer's. This first section of
the report shows how your many language choices have worked together to form
identifiable, targeted moves for your assignment. The boxplots should help
you visualize the number of instances that you used language to craft moves
that point your reader toward your rhetorical purpose. The boxplots can also
be used as the basis for a comparison between your text and your peer's.`,
  stv_intro: `In this next section of our personalized report, you will see
the particular categories outlined above identified within the context of your
own writing. These categories are what we consider to be "core" for the task
of writing this type of document, but they can be expressed in different ways
by different writers--and they blend with other compositional moves to
accomplish the purpose of your document.`
};

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  assignments_base_url = 'assets/assignments/';

  constructor(private http: HttpClient) { }

  getAssignment(assignment: string): Observable<AssignmentData> {
    return this.http.get<AssignmentData>(`${this.assignments_base_url}${assignment}.json`)
      .pipe(
        catchError(err => of(DefaultAssignmentData))
      );
  }
}
