import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(raiz, 'capturas');
mkdirSync(out, { recursive: true });

const panel = [
  'p1-clientes',
  'p2-dar-de-alta',
  'p3-ficha-cliente',
  'p4-armar-rutina',
  'p5-biblioteca-ejercicios',
  'p6-pagos-del-mes',
  'p7-registrar-pago-plan',
  'p8-ruta-mas-1',
];

const cliente = [
  ['boceto-panel', 'c1-cliente-inicio'],
  ['boceto-panel', 'c2-cliente-mensualidad-vencida'],
  ['boceto-panel', 'c3-cliente-cierre-sesion'],
  ['boceto-panel', 'c4-cliente-prueba-gratis'],
  ['boceto-panel', 'c5-cliente-como-sigues'],
  ['boceto-panel', 'c6-cliente-su-fase'],
  ['boceto-panel', 'c7-cliente-cambiar-ejercicio'],
  ['boceto-panel', 'c8-cliente-termino-ruta'],
  ['boceto-app', '1-sesion-de-hoy'],
  ['boceto-app', '2-registrar-serie'],
  ['boceto-app', '3-mi-avance-celular'],
];

test.describe('bocetos panel 1280', () => {
  for (const nombre of panel) {
    test(nombre, async ({ page }, info) => {
      test.skip(info.project.name !== 'panel', 'solo 1280');
      const url = pathToFileURL(join(raiz, 'boceto-panel', `${nombre}.html`)).href;
      await page.goto(url);
      await page.screenshot({ path: join(out, `boceto-${nombre}.png`), fullPage: true });
    });
  }
});

test.describe('bocetos cliente 390', () => {
  for (const [carpeta, nombre] of cliente) {
    test(nombre, async ({ page }, info) => {
      test.skip(info.project.name !== 'cliente', 'solo 390');
      const url = pathToFileURL(join(raiz, carpeta, `${nombre}.html`)).href;
      await page.goto(url);
      await page.screenshot({ path: join(out, `boceto-${nombre}.png`), fullPage: true });
    });
  }
});
