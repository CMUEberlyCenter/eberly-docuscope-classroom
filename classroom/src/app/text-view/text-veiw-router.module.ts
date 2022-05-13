import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TextViewComponent } from './text-view.component';

const routes: Routes = [{ path: '', component: TextViewComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TextViewRoutingModule {}
