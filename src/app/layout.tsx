import type { Metadata } from 'next';
import { plataforma } from '@/config/plataforma';
import { CapaCargando } from '@/components/CapaCargando';
import { IndicadorDev } from '@/components/IndicadorDev';
import './globals.css';

export const metadata: Metadata = {
  title: plataforma.marca,
  description: 'La app de Un Kilo Más.',
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=Source+Sans+3:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CapaCargando />
        <IndicadorDev />
        {children}
      </body>
    </html>
  );
}
