import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('/api/auth/change-password', () => {
  it('requiere email y contraseña actual para cambiar la contraseña', async () => {
    const response = await POST(new Request('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'usuario@ejemplo.com',
        currentPassword: 'oldpass',
      }),
    }));

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('nueva');
  });
});
