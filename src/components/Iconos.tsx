export function Icono({
  nombre,
  className,
}: {
  nombre: 'cerrar' | 'menu' | 'atras' | 'plantilla' | 'borrador' | 'publicar' | 'mas' | 'copiar' | 'flecha' | 'basura' | 'lupa' | 'ojo' | 'lapiz' | 'salir';
  className?: string;
}) {
  const comun = {
    className: className ?? 'icono',
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (nombre) {
    case 'cerrar':
      return (
        <svg {...comun}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...comun}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'atras':
      return (
        <svg {...comun}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case 'plantilla':
      return (
        <svg {...comun}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case 'borrador':
      return (
        <svg {...comun}>
          <path d="M5 20h14" />
          <path d="M7 20V8l5-4 5 4v12" />
          <path d="M10 12h4" />
        </svg>
      );
    case 'publicar':
      return (
        <svg {...comun}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case 'mas':
      return (
        <svg {...comun}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'copiar':
      return (
        <svg {...comun}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M4 16V6a2 2 0 012-2h10" />
        </svg>
      );
    case 'flecha':
      return (
        <svg {...comun}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'basura':
      return (
        <svg {...comun}>
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M7 7l1 13h8l1-13" />
        </svg>
      );
    case 'lupa':
      return (
        <svg {...comun}>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l5 5" />
        </svg>
      );
    case 'ojo':
      return (
        <svg {...comun}>
          <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'lapiz':
      return (
        <svg {...comun}>
          <path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5 4 20z" />
          <path d="M13.5 7l3.5 3.5" />
        </svg>
      );
    case 'salir':
      return (
        <svg {...comun}>
          <path d="M10 6V5a1 1 0 011-1h8a1 1 0 011 1v14a1 1 0 01-1 1h-8a1 1 0 01-1-1v-1" />
          <path d="M4 12h11" />
          <path d="M12 8l4 4-4 4" />
        </svg>
      );
  }
}
