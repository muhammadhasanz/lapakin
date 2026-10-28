export type Constructor<T = any> = new (...args: any[]) => T;

class ContainerRegistry {
  private instances = new Map<any, any>();

  public set(token: any, value: any): void {
    this.instances.set(token, value);
  }

  public get<T>(token: Constructor<T> | string | symbol): T {
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }
    if (typeof token === 'function') {
      const instance = new (token as Constructor<T>)();
      this.instances.set(token, instance);
      return instance;
    }
    throw new Error(`Service not found for token: ${String(token)}`);
  }

  public has(token: any): boolean {
    return this.instances.has(token);
  }

  public reset(): void {
    this.instances.clear();
  }
}

export const Container = new ContainerRegistry();

export function Service(name?: string): ClassDecorator {
  return (target: any) => {
    if (name) {
      Container.set(name, target);
    }
  };
}

export function Inject(token?: any): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    // metadata placeholder
  };
}
