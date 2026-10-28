export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export function buildMeta(page: number, perPage: number, total: number): PageMeta {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  };
}
