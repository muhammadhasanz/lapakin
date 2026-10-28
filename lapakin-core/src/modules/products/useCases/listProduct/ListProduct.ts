import { buildMeta, Container, type PageMeta, Service, type UseCase } from '@/shared/index.ts';
import { ProductMapper } from '../../mappers/ProductMapper.ts';
import ProductRepo from '../../repos/ProductRepo.ts';
import type ListProductDTO from './ListProductDTO.ts';

export interface ListProductResponse {
  data: any[];
  meta: PageMeta;
}

@Service()
export default class ListProduct implements UseCase<ListProductDTO, Promise<ListProductResponse>> {
  constructor(private productRepo: ProductRepo = Container.get(ProductRepo)) {}

  async execute(req: ListProductDTO): Promise<ListProductResponse> {
    const sortRaw = req.sort ?? 'product_name';
    const isDesc = sortRaw.startsWith('-');
    const cleanSort = sortRaw.replace(/^-/, '') as 'product_name' | 'price' | 'stock';

    const validSorts = ['product_name', 'price', 'stock'];
    const finalSort = validSorts.includes(cleanSort) ? cleanSort : 'product_name';

    const result = await this.productRepo.list({
      page: req.page,
      per_page: req.per_page,
      search: req.search,
      sort: finalSort,
      order: isDesc ? 'desc' : 'asc',
    });

    const meta = buildMeta(req.page, req.per_page, result.total);
    return {
      data: result.docs.map(ProductMapper.toDTO),
      meta,
    };
  }
}
