import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import { ProductMapper } from '../../mappers/ProductMapper.ts';
import CreateProduct from './CreateProduct.ts';
import CreateProductDTO from './CreateProductDTO.ts';

@Service()
export default class CreateProductController extends Controller {
  constructor(private createProduct: CreateProduct = Container.get(CreateProduct)) {
    super();
  }

  registerRoutes(): void {
    this.router.post('/products', this.store.bind(this));
  }

  async store(c: Context) {
    const raw = await c.req.json();
    const dto = transformAndValidate(CreateProductDTO, raw);
    const product = await this.createProduct.execute(dto);
    return this.created(c, ProductMapper.toDTO(product), 'Product created successfully');
  }
}
