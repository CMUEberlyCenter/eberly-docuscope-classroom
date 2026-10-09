/* Component for selecting the category from a menu button.

Using the common dictionary, constructs the selection
menu so that users can select the desired category.
It organizes the categories in the same hierarchy as
specified in the common dictionary.
It will only show the category, subcategory, and cluster
levels.  LAT and Tone levels are not accessible.
*/
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  ViewChild
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { CommonDictionary, Entry, ICluster } from '../common-dictionary';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [MatMenuModule],
})
export class CategorySelectComponent {
  dictionary = input<CommonDictionary | undefined>();
  selectedCategory = model<Entry | undefined>();
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  /**
   * Event handler for selecting a category.
   * @param cat The (sub)category selected
   */
  selectCategory(cat: Entry): void {
    this.selectedCategory.set(cat);
    this.menuTrigger.closeMenu(); // Needs to force close menu on non-leaf nodes.
  }
  /**
   * Event handler for selecting a cluster.
   * @param menuItem The selected cluster
   */
  selectCluster(menuItem: ICluster): void {
    this.selectedCategory.set(menuItem);
    // this.selectedCategoryChange.emit(this.selectedCategory);
  }
}
