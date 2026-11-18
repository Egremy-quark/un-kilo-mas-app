import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(raiz, 'docs', 'guia');
mkdirSync(out, { recursive: true });

const correo = process.env.PLAYWRIGHT_ENTRENADOR_CORREO ?? 'demo.entrenador@example.com';
const clave = process.env.PLAYWRIGHT_ENTRENADOR_CLAVE ?? process.env.DEMO_CLIENTE_CLAVE ?? 'UnKiloMas-demo-16';

async function entrar(page: Page) {
  await page.goto('/entrar');
  await page.getByLabel('Correo').fill(correo);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/entrar'), { timeout: 25_000 });
}

async function shot(page: Page, nombre: string, fullPage = true) {
  await page.waitForFunction(
    () => {
      if (document.documentElement.getAttribute('data-cargando') === '1') return false;
      return !document.querySelector('.capa-cargando.is-on:not(.capa-cargando-global)');
    },
    { timeout: 25_000 },
  ).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${nombre}.png`), fullPage });
}

test('capturas del manual', async ({ page }) => {
  test.setTimeout(180_000);
  await entrar(page);
  await page.goto('/panel');
  await shot(page, 'clientes');

  const filaDemo = page.getByRole('row', { name: /Demo Prueba/ });
  if (await filaDemo.isVisible().catch(() => false)) {
    await filaDemo.getByRole('link', { name: 'Abrir' }).click();
    await page.getByRole('heading', { name: /Demo Prueba/ }).waitFor({ timeout: 25_000 });
    await shot(page, 'ficha-cliente');
    const ver = page.getByRole('link', { name: /Ver como este cliente|Ver como cliente/i });
    if (await ver.isVisible().catch(() => false)) {
      await ver.click();
      await page.getByText(/Demo \/ prueba/i).waitFor({ timeout: 25_000 });
      await shot(page, 'vista-cliente');
    }
  }

  await page.goto('/panel/programas/ruta-1');
  await shot(page, 'ruta');
  const abrirRemate = page.getByRole('row', { name: /Remate/i }).getByRole('link', { name: 'Abrir' });
  if (await abrirRemate.isVisible().catch(() => false)) {
    await abrirRemate.click();
  } else {
    const links = page.getByRole('link', { name: 'Abrir' });
    await links.last().click();
  }
  await page.getByRole('heading', { name: /Remate/i }).waitFor({ timeout: 25_000 });
  await shot(page, 'editor-remate');
  const buscar = page.getByPlaceholder('Buscar ejercicio');
  if (await buscar.isVisible().catch(() => false)) {
    await buscar.click();
    await page.waitForTimeout(400);
    await shot(page, 'selector-ejercicios');
    await page.keyboard.press('Escape');
  } else {
    const fila = page.getByRole('button', { name: /Sentadilla|Press/i }).first();
    if (await fila.isVisible().catch(() => false)) {
      await fila.click();
      await page.waitForTimeout(500);
      await page.getByPlaceholder('Buscar ejercicio').click();
      await page.waitForTimeout(400);
      await shot(page, 'selector-ejercicios');
    }
  }

  await page.goto('/panel/programas/prueba');
  await shot(page, 'prueba');
  await page.goto('/panel/plantillas');
  await shot(page, 'plantillas');
  await page.goto('/panel/ejercicios');
  await shot(page, 'ejercicios', false);
  await page.goto('/panel/pagos');
  await shot(page, 'pagos');
  await page.goto('/panel/leads');
  await shot(page, 'leads');
});

test.describe('móvil editor', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('captura móvil remate', async ({ page }) => {
    test.setTimeout(120_000);
    await entrar(page);
    await page.goto('/panel/programas/ruta-1');
    const abrir = page.getByRole('link', { name: 'Abrir' }).last();
    await abrir.click();
    await page.getByRole('heading', { name: /Remate/i }).waitFor({ timeout: 25_000 });
    await shot(page, 'editor-remate-movil', false);
    const item = page.getByRole('button', { name: /Sentadilla/ }).first();
    if (await item.isVisible().catch(() => false)) {
      await item.click({ force: true });
      await page.getByText('Editando el ejercicio').waitFor({ timeout: 8_000 });
      await shot(page, 'editor-ejercicio-movil', false);
    }
  });
});
