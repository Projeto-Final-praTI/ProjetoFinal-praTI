import { parsePath, paths } from '../router';

describe('router', () => {
  test('parsePath resolves main routes', () => {
    expect(parsePath('/')).toEqual({ name: 'home' });
    expect(parsePath('/login')).toEqual({ name: 'login' });
    expect(parsePath('/cadastro')).toEqual({ name: 'register' });
    expect(parsePath('/sobre')).toEqual({ name: 'about' });
    expect(parsePath('/admin')).toEqual({ name: 'admin' });
    expect(parsePath('/perfil')).toEqual({ name: 'profile' });
  });

  test('parsePath normalizes trailing slash and missing tabs', () => {
    expect(parsePath('/login/')).toEqual({ name: 'login' });
    expect(parsePath('/desaparecidos')).toEqual({ name: 'missing', tab: 'active' });
    expect(parsePath('/desaparecidos/denunciar')).toEqual({ name: 'missing', tab: 'report' });
    expect(parsePath('/desaparecidos/moderacao')).toEqual({ name: 'missing', tab: 'moderation' });
  });

  test('parsePath resolves missing person detail and unknown routes', () => {
    expect(parsePath('/desaparecidos/abc-123')).toEqual({ name: 'missing-detail', id: 'abc-123' });
    expect(parsePath('/desaparecidos/abc%20123')).toEqual({ name: 'missing-detail', id: 'abc 123' });
    expect(parsePath('/rota-inexistente')).toEqual({ name: 'unknown' });
  });

  test('paths helpers return canonical urls', () => {
    expect(paths.home).toBe('/');
    expect(paths.login).toBe('/login');
    expect(paths.register).toBe('/cadastro');
    expect(paths.missing).toBe('/desaparecidos');
    expect(paths.missingReport).toBe('/desaparecidos/denunciar');
    expect(paths.missingModeration).toBe('/desaparecidos/moderacao');
    expect(paths.missingDetail('id x')).toBe('/desaparecidos/id%20x');
    expect(paths.admin).toBe('/admin');
    expect(paths.profile).toBe('/perfil');
  });
});
