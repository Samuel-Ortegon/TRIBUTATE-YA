declare module 'pg' {
  export interface QueryResult<T> {
    rows: T[];
    rowCount: number | null;
  }

  export interface PoolClient {
    query<T = Record<string, unknown>>(consulta: string, valores?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export class Pool {
    constructor(opciones: {
      connectionString?: string;
      ssl?: { rejectUnauthorized: boolean };
      max?: number;
      idleTimeoutMillis?: number;
    });
    query<T>(consulta: string, valores?: unknown[]): Promise<{ rows: T[] }>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }

  export const types: {
    setTypeParser(oid: number, parser: (valor: string) => unknown): void;
  };
}
