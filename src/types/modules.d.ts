declare module '@vercel/connect' {
  export function getToken(name: string, options?: unknown): Promise<string>;
}

declare module 'resend' {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send: (payload: Record<string, unknown>) => Promise<{ id?: string } | Record<string, unknown>>;
    };
  }
}
