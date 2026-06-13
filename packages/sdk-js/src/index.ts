export interface BackentConfig {
  apiUrl: string;
  apiKey: string;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BackentClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: BackentConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  table<T extends Record<string, unknown> = Record<string, unknown>>(name: string) {
    return new TableClient<T>(this.apiUrl, this.apiKey, name);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new BackentError(response.status, await response.text());
    }

    return response.json() as Promise<T>;
  }
}

class TableClient<T extends Record<string, unknown>> {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private table: string,
  ) {}

  private get basePath() {
    return `${this.apiUrl}/${this.table}`;
  }

  async list(options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.sort) params.set('sort', options.sort);
    if (options.order) params.set('order', options.order);

    const response = await fetch(`${this.basePath}?${params}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    if (!response.ok) throw new BackentError(response.status, await response.text());
    return response.json();
  }

  async create(data: Partial<T>): Promise<{ success: boolean }> {
    const response = await fetch(this.basePath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new BackentError(response.status, await response.text());
    return response.json();
  }

  async update(id: string, data: Partial<T>): Promise<{ success: boolean }> {
    const response = await fetch(`${this.basePath}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new BackentError(response.status, await response.text());
    return response.json();
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.basePath}/${id}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': this.apiKey },
    });
    if (!response.ok) throw new BackentError(response.status, await response.text());
    return response.json();
  }
}

export class BackentError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(`Backent API Error (${statusCode}): ${message}`);
    this.name = 'BackentError';
  }
}

export default BackentClient;
