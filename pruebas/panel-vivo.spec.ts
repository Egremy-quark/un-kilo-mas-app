import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(raiz, 'capturas');
mkdirSync(out, { recursive: true });

const entrenadorCorreo = process.env.PLAYWRIGHT_ENTRENADOR_CORREO ?? 'demo.entrenador@example.com';
const entrenadorClave = process.env.PLAYWRIGHT_ENTRENADOR_CLAVE ?? process.env.DEMO_CLIENTE_CLAVE ?? 'UnKiloMas-demo-16';
const demoClave = process.env.DEMO_CLIENTE_CLAVE ?? 'UnKiloMas-demo-16';

const bocetos: { archivo: string; etiqueta: string }[] = [
  { archivo: 'p1-clientes', etiqueta: 'panel' },
  { archivo: 'p8-ruta-mas-1', etiqueta: 'ruta-1' },
  { archivo: 'p5-biblioteca-ejercicios', etiqueta: 'ejercicios' },
  { archivo: 'p6-pagos-del-mes', etiqueta: 'pagos' },
  { archivo: 'p2-dar-de-alta', etiqueta: 'alta' },
  { archivo: 'p4-armar-rutina', etiqueta: 'constructor' },
];

async function entrar(page: Page, correo: string, clave: string) {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/entrar'), { timeout: 20_000 });
}

async function captura(page: Page, nombre: string) {
  await page.screenshot({ path: join(out, `${nombre}.png`), fullPage: true });
}

test.describe('bocetos vs panel', () => {
  for (const b of bocetos) {
    test(`boceto ${b.archivo}`, async ({ page }, info) => {
      test.skip(info.project.name === 'cliente', 'bocetos de panel');
      const url = pathToFileURL(join(raiz, 'boceto-panel', `${b.archivo}.html`)).href;
      await page.goto(url);
      const ancho = info.project.name.includes('375') ? 375 : 1280;
      await captura(page, `boceto-${b.etiqueta}-${ancho}`);
    });
  }
});

test.describe('panel publicado', () => {
  test.skip(!entrenadorCorreo || !entrenadorClave, 'Falta PLAYWRIGHT_ENTRENADOR_CLAVE');

  test('rutas, scrollWidth y constructor', async ({ page }, info) => {
    test.skip(info.project.name === 'cliente', 'solo panel');
    test.setTimeout(120_000);
    const ancho = page.viewportSize()?.width ?? 1280;
    await entrar(page, entrenadorCorreo, entrenadorClave);

    const rutas: { path: string; nombre: string }[] = [
      { path: '/panel', nombre: 'panel' },
      { path: '/panel/programas/ruta-1', nombre: 'ruta-1' },
      { path: '/panel/programas/prueba', nombre: 'prueba' },
      { path: '/panel/plantillas', nombre: 'plantillas' },
      { path: '/panel/ejercicios', nombre: 'ejercicios' },
      { path: '/panel/pagos', nombre: 'pagos' },
      { path: '/panel/clientes/nuevo', nombre: 'alta' },
    ];

    for (const r of rutas) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      if (ancho <= 400) {
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(sw, r.path).toBe(ancho);
      }
      await captura(page, `vivo-${r.nombre}-${ancho}`);
    }

    await page.goto('/panel/programas/ruta-1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Abrir' }).first().click();
    await page.waitForURL(/\/panel\/rutinas\//);
    await page.waitForTimeout(800);
    if (ancho <= 400) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(ancho);
    }
    await captura(page, `vivo-constructor-${ancho}`);
    expect(await page.getByRole('heading').first().innerText()).toMatch(/Fase 1/i);

    await page.goto('/panel/programas/ruta-1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Ver como cliente' }).first().click();
    await page.waitForURL(/\/panel\/vista-cliente\//);
    await page.waitForTimeout(800);
    await captura(page, `vivo-vista-cliente-${ancho}`);
    if (ancho <= 400) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(ancho);
    }
  });
});

test.describe('app del cliente demo', () => {
  for (const demo of [
    { correo: process.env.DEMO_CLIENTE_PRUEBA_CORREO ?? 'demo.prueba@example.com', slug: 'prueba' },
    { correo: process.env.DEMO_CLIENTE_RUTA_CORREO ?? 'demo.ruta@example.com', slug: 'ruta' },
    { correo: process.env.DEMO_CLIENTE_COACHING_CORREO ?? 'demo.coaching@example.com', slug: 'coaching' },
  ]) {
    test(`${demo.slug} inicio sesión mensualidad`, async ({ page }, info) => {
      test.skip(info.project.name !== 'panel-375', 'solo 375');
      await entrar(page, demo.correo, demoClave);
      await page.goto('/app');
      await captura(page, `cliente-${demo.slug}-inicio-375`);
      await page.goto('/app/sesion');
      await captura(page, `cliente-${demo.slug}-sesion-375`);
      await page.goto('/app/mensualidad');
      await captura(page, `cliente-${demo.slug}-mensualidad-375`);
    });
  }
});

test.afterAll(() => {
  const html = `<!doctype html><meta charset="utf-8"><title>Comparación boceto vs panel</title>
<style>body{font-family:sans-serif;background:#faf7f0;padding:24px}img{width:48%;border:1px solid #ddd;vertical-align:top}h2{margin-top:32px}</style>
<h1>Boceto vs panel</h1>
${['panel', 'ruta-1', 'ejercicios', 'pagos', 'alta', 'constructor'].map(
  (n) =>
    `<h2>${n}</h2><img src="boceto-${n}-1280.png"><img src="vivo-${n}-1280.png"><br><img src="boceto-${n}-375.png"><img src="vivo-${n}-375.png">`,
).join('')}
`;
  writeFileSync(join(out, 'comparacion.html'), html);
});
