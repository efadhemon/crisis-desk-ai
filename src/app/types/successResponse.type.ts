export class SuccessResponse<T = any> {
  constructor(
    message?: string,
    data?: T,
    meta?: {
      total?: number;
      limit?: number;
      page?: number;
      skip?: number;
    },
  ) {
    this.success = true;
    this.statusCode = 200;
    this.message = message || 'Success';
    if (meta) {
      this.meta = meta;
    }
    this.data = data || null;
  }

  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T;
  public meta: {
    total?: number;
    limit?: number;
    page?: number;
    skip?: number;
  };
}
