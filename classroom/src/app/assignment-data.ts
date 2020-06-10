export class DictionaryInformation {
  id: string;
  name: string;
  description?: string;
}

export class AssignmentData {
  course?: string;
  assignment?: string;
  instructor?: string;
  categories?: DictionaryInformation[];
}

export type CategoryInfoMap = Map<string, DictionaryInformation>;

export function genCategoryInfoMap(adata: AssignmentData): CategoryInfoMap {
  const cmap = new Map<string, DictionaryInformation>();
  for (const clust of adata.categories) {
    cmap.set(clust.id, clust);
  }
  return cmap;
}
