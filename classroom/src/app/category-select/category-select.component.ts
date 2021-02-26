import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonDictionary, Entry, ICluster } from "../common-dictionary";
import { CommonDictionaryService } from "../common-dictionary.service";

@Component({
  selector: "app-category-select",
  templateUrl: "./category-select.component.html",
  styleUrls: ["./category-select.component.css"],
})
export class CategorySelectComponent implements OnInit {
  @Input() selectedCategory: string;
  @Output() selectedCategoryChange = new EventEmitter<string>();
  data: CommonDictionary;
  constructor(private _dictionary: CommonDictionaryService) {}

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    this._dictionary.getJSON().subscribe((data) => {
      this.data = data;
    });
  }

  selectCategory(cat: Entry): void {
    this.selectedCategory = cat.name ?? cat.label;
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
  selectCluster(menuItem: ICluster): void {
    this.selectedCategory = menuItem.name;
    this.selectedCategoryChange.emit(this.selectedCategory);
  }
}
