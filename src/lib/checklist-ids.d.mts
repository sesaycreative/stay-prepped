export declare function slugify(text: string): string;
export declare function itemIds(texts: string[]): string[];
export declare function checklistId(scope: string, page: string, section?: string): string;
export declare function domId(listId: string, itemId: string): string;
export declare const GUIDE_AREAS: Record<string, string | { section: string; area: string }>;
export declare function areaForGuideList(guideSlug: string, sectionSlug: string): string | undefined;
