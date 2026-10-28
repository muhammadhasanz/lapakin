import { pingDatabase } from './healthCheck.ts';

export class LoaderManager {
  public static async load(): Promise<void> {
    const dbOk = await pingDatabase();
    if (!dbOk) {
      console.warn('[Loader] Database connection check pending or failed');
    } else {
      console.log('[Loader] Database connected');
    }
  }
}

LoaderManager.load();
