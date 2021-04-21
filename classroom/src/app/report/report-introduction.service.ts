import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface IntroductionText {
  introduction: string;
  stv_introduction: string;
}

/* eslint max-len: ["error", { "ignoreStrings": true }] */
const DefaultIntroduction: IntroductionText = {
  introduction:
    'This report gives you two ways to think about your choices for your writing. The first section of the report focuses on boxplots that show you rhetorical variation. The boxplots can help you see how your writerly choices fit within the world of other writers’ choices. Read the boxplots like this: the grey “box” represents the middle 50% of writers’ papers that were analyzed. Within that, the middle line represents the median or the middle of the distribution. The horizontal line and the two vertical lines on each end represent the full range of the other papers that made use of this strategy to varying degrees. The black dot represents your paper. If there are any white dots, those represent “outliers” in the data (papers that used strategies at a much higher or lower frequency than the average). Use these boxplots to help you investigate your choices and account for them, but do not use the boxplots as indicators of effectiveness.',
  stv_introduction:
    'The prior section showed you a “big picture” view of how your writing patterns fit in and stand out among a group of other writers’ texts. This next section gives a particular, small view to see how the same writing patterns show up in your own text. What you see in this section is a “coded” version of your paper. The underlined words followed by [brackets] connect to the same categories in the previous section. A computer-assisted rhetorical analysis tool like Docuscope Classroom can only make visible your language choices that point to particular rhetorical purposes. Its support, as a learning tool, ends there. It is up to you to notice your choices and account for them within the context of this assignment.',
};

@Injectable({
  providedIn: 'root',
})
export class ReportIntroductionService {
  private _assets_intro = 'assets/report_introduction_default.json';

  constructor(private http: HttpClient) {}

  getIntroductionText(): Observable<IntroductionText> {
    return this.http
      .get<IntroductionText>(this._assets_intro)
      .pipe(catchError((_err) => of(DefaultIntroduction)));
  }
}
