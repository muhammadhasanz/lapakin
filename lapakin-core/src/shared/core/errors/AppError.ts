export class AppError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, status = 500, errors?: Record<string, string[]>) {
    super(message);
    this.message = message;
    this.status = status;
    this.errors = errors;
  }
}
