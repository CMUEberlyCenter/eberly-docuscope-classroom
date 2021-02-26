import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AboutComponent } from "../about/about.component";
import { AssignmentService } from "../assignment.service";
import { SettingsService } from "../settings.service";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit {
  title = "DocuScope Classroom";
  institution = "@ CMU";
  course: string;
  assignment: string;
  instructor: string;

  constructor(
    private about: MatDialog,
    private assignmentService: AssignmentService,
    private settingsService: SettingsService
  ) {
    assignmentService.course$.subscribe((c) => (this.course = c));
    assignmentService.assignment$.subscribe((c) => (this.assignment = c));
    assignmentService.instructor$.subscribe((c) => (this.instructor = c));
  }

  getSettings() {
    this.settingsService.getSettings().subscribe((settings) => {
      this.title = settings.title;
      if (settings.institution) {
        this.institution = `@ ${settings.institution}`;
      } else {
        this.institution = "";
      }
    });
  }

  ngOnInit() {
    this.getSettings();
  }

  openAbout(): void {
    this.about.open(AboutComponent);
  }
}
