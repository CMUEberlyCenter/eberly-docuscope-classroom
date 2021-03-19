export interface Entry {
  name?: string;
  label: string;
  help: string;
}
export interface ICluster {
  name: string;
  label: string;
  help: string;
}
export interface Category extends Entry {
  clusters: ICluster[];
}
interface ISubcategory extends Entry {
  clusters: ICluster[];
}
interface ICategory extends Entry {
  subcategories: ISubcategory[];
}
export interface ICommonDictionary {
  default_dict: string;
  custom_dict: string;
  use_default_dict: boolean;
  timestamp: string;
  categories: ICategory[];
}

export interface CommonDictionaryTreeNode {
  id: string;
  label: string;
  help?: string;
  children?: CommonDictionaryTreeNode[];
}

export class CommonDictionary implements ICommonDictionary {
  default_dict: string;
  custom_dict: string;
  use_default_dict: boolean;
  timestamp: string;
  categories: ICategory[];

  constructor(data: ICommonDictionary) {
    Object.assign(this, data);
  }

  get tree(): CommonDictionaryTreeNode[] {
    //let id = 0;
    return this.categories.map((category: ICategory) => ({
      id: category.name ?? category.label,
      label: category.label,
      //id: id++,
      help: category.help,
      children: category.subcategories.map((subcategory: ISubcategory) => ({
        label: subcategory.label,
        id: subcategory.name ?? subcategory.label,
        //id: id++,
        help: subcategory.help,
        children: subcategory.clusters.map((cluster: ICluster) => ({
          label: cluster.label,
          id: cluster.name,
          //id: id++,
          help: cluster.help,
          // hasChildren: true
        })),
      })),
    }));
  }
}
