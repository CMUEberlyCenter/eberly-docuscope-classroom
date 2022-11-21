/* Component for selecting the category from a menu button.

Using the common dictionary, constructs the selection
menu so that users can select the desired category.
It organizes the categories in the same hierarchy as
specified in the common dictionary.
It will only show the category, subcategory, and cluster
levels.  LAT and Tone levels are not accessible.
*/
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatLegacyMenuTrigger as MatMenuTrigger } from '@angular/material/legacy-menu';
import { CommonDictionary, Entry, ICluster } from '../common-dictionary';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.scss'],
})
export class CategorySelectComponent {
  @Input() dictionary: CommonDictionary | undefined;
  @Input() selectedCategory: Entry | undefined;
  @Output() selectedCategoryChange = new EventEmitter<Entry>();
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  /**
   * Event handler for selecting a category.
   * @param cat The (sub)category selected
   */
  selectCategory(cat: Entry): void {
    this.selectedCategory = cat;
    this.selectedCategoryChange.emit(this.selectedCategory);
    this.menuTrigger.closeMenu(); // Needs to force close menu on non-leaf nodes.
  }
  /**
   * Event handler for selecting a cluster.
   * @param menuItem The selected cluster
   */
  selectCluster(menuItem: ICluster): void {
    this.selectedCategory = menuItem;
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
}
