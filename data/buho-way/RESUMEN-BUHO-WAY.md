# RESUMEN — Buho Way 2026: Excel → plantillas canónicas para Un Kilo Más

**Fecha:** 2026-11-20 · **Origen:** carpeta de Google Drive "Buho Way 2026"
(`1JQlTfkRt0abDIVYEhGyHBe-0eoJnYMtU`) · **Salida:**
`~/workspace/goals/joint-fitness-brand-with-yohan/files/plantillas-buho-way/`

## Resultado en una línea

**119 archivos Excel → 69 plantillas canónicas** (1.059 ejercicios, 50 variantes).
Nada se escribió en la plataforma ni en Drive: solo lectura y archivos nuevos.

## Conteos

| | Nº |
|---|---|
| Archivos `.xlsx` en Drive | 121 |
| Descargados y procesados | **119** |
| Saltados (temporales `~$...`) | 2 |
| PDF revisados (sin programa nuevo) | 5 |
| Ejercicios totales parseados | 1.848 |
| Firmas de contenido únicas | 113 |
| Nombres canónicos de programa | 64 |
| **Plantillas canónicas** | **69** |
| Variantes documentadas | 50 |
| Ejercicios distintos (`nombre_clave`) | 396 |
| Superseries resueltas | 224 |
| Ejercicios con subprescripciones (TOP SET / BACK OFF / VOLUME SETS…) | 78 |
| Ejercicios sin prescripción | **0** |
| Nombres de ejercicio dudosos ("bogus") | **0** |

### Por fase

| Fase | Plantillas |
|---|---|
| Fase 1 — En Casa | 13 |
| Fase 2 — Aprender a Moverse | 9 |
| Fase 3 — Aprendiendo Fuerza | 11 |
| Fase 3 — Introducción a la Fuerza | 9 |
| Fase 4 — BIIO Evolucionado | 11 |
| Fase 5 — EL CAMINO | 9 |
| Fase 6 — Bloques de Power | 7 |

### Por enfoque (inferido del nombre; revisable por Yohan)

| Enfoque | Plantillas |
|---|---|
| Técnica | 43 |
| Fuerza | 22 |
| Hipertrofia | 3 |
| Transición | 1 |

### Duración

| Semanas | Plantillas |
|---|---|
| 3 | 24 |
| 4 | 29 |
| 5 | 4 |
| 6 | 6 |
| 7 | 6 |

| Días por plantilla | Plantillas |
|---|---|
| 1 día | 3 |
| 2 días | 36 |
| 3 días | 18 |
| 4 días | 12 |

## Decisiones de dedup

Los 119 archivos son muchas veces el mismo programa con otro nombre. Reglas
aplicadas (detalladas en `README.md`):

1. **Nombre canónico**: se quitan sufijos de cliente (Buho Gym, Carlos,
   Marialy, Clau, Cesar, Gera, Alberto, Marko, Nayee, Jorge, Otho, Eí, Saraí
   Molina, Iris Janeth, Lu, Alma G, Eduardo Besares, Kechas, Ale Diaz,
   Lupita Lu, Yohan, Juan Reyes, Ally, Lalee, Checho HM, MiMix, Gerardo,
   Sofi, Lupe), población (Mujeres, Hombres, Girls, Niñas), material (Poco
   Material, Sin Máquinas), unidades (Lbs) y formato (Formato 2). También se
   normaliza el ordinal inicial (`7 Mesociclo` = `7° Mesociclo`) y artefactos
   de tecleo (`Peaking+}TAPPER` → `Peaking+TAPPER`).
2. **Fusión por contenido idéntico** (1 caso): `6° Mesociclo-Introducción
   hibrida` = `6° Mesociclo-Introducción a la hipertrofia 1` (misma firma,
   misma fase). Nombre elegido: **"6° Mesociclo-Introducción a la
   hipertrofia 1"**; el otro quedó en `nombre_alias`. Confirmar con Yohan
   cuál es el nombre correcto.
3. **Subgrupos separados** (6): un archivo se separa como plantilla propia
   cuando su coincidencia posicional con el archivo base es < 60 %, o lleva
   etiqueta de formato/material distinto y coincide < 70 %.

| Plantilla separada | Coincidencia | Archivos |
|---|---|---|
| `1° Microciclo - IF1 (Búho Gym)` | 15 % | 1 |
| `2° Mesosciclo - Preparación fuerza (GIRL)` | 56 % | 2 (la variante de Hiperlordosis es una variante de esta) |
| `2° Mesosiclo - Aprendiendo Maestría Tecnica (Formato 2)` | 60 % | 3 |
| `3° Mesociclo - Aprender a Entrenar (Buho Gym)` | 58 % | 1 |
| `3° Microciclo - Aprender a moverse 3 (Versión Sin Máquinas)` | 20 % | 1 |
| `4° Microciclo - Aprender a moverse 4 (ALLY)` | 0 % | 1 |

Casos límite que quedaron como **variantes** (no se separan): "Aprender a
Entrenar-Carlos Moreno" (67 %: mismo programa, typo "AMRAPR" y reps de
accesorios 6/8/10 → 10 a 12) y "Maestría Tecnica-Marko" (70 %).

4. **La plantilla toma el contenido del archivo base** (sin etiquetas; si no
   hay, el de más ejercicios). Las variantes solo documentan diferencias:
   sustituciones de accesorios (p. ej. `PRESS DE HOMBRO (MANCUERNAS)` →
   `ELEVACIONES LATERALES`, `DOMINADA SUPINA (O RACK CHINS)` → `LAT MACHINE
   AGARRE NEUTRO`) y pequeños cambios de reps. Los básicos y el esquema de
   series/reps son los mismos.

## Ejercicios sin emparejar con la biblioteca

La plataforma tiene 121 ejercicios con patrón (Accesorio 38, Empuje 30,
Rodilla 23, Jalón 17, Bisagra 13), pero **la lista no está en el workspace**,
así que no se pudo hacer el emparejamiento automático. Queda pendiente.

- **396 ejercicios distintos** (`nombre_clave`) en las plantillas; inventario
  completo en `ejercicios-distintos.json` (con la grafía más común y el nº
  de plantillas donde aparece).
- 258 aparecen en 1 sola plantilla; 100 en 2–5; 38 en 6 o más.
- Los 10 más usados: PRESS BANCA (33 plantillas), LEG CURL (27), PRESS
  MILITAR (26), EXTENSIONES DE PIERNA (22), PESO MUERTO (22), PRESS FRANCES
  (22), CRUNCH INVERSO (20), SENTADILLA CON BARRA (20), CURL DE BÍCEPS (18),
  PLANCHA FRONTAL (17).
- 25 ejercicios tienen varias grafías (p. ej. BIRD-DOG en 4 grafías,
  DEAD BUG en 2). Hay que unificar la grafía al emparejar con la biblioteca.

## Archivos saltados y por qué

| Archivo / hoja | Motivo |
|---|---|
| `~$…` (2 archivos temporales de Excel) | Archivos de bloqueo de Excel, no contenido. |
| Hojas `Portada` (en muchos archivos) | Registros del atleta (peso, marcas, medidas), no son días de entreno. |
| Hojas `TOMA DE MARCAS` | Día de testeo de marcas, no es día de entreno. |
| 5 PDF | Son exportaciones de programas que ya existen como `.xlsx`. Verificado por comparación de ejercicios: `5° Mesociclo - Intensificare` 22/22, `5° Mesociclo-IF5` 29/29, `2° Microciclo - IF2- Búho Gym` 14/15, `Gera-2 Mesociclo- IF2` 10/12, `1 Mesociclo - Recuperando Intensidad y Tecnica` 6/12. **El `.xlsx` manda**; los PDF no se convirtieron. |

## Valores sospechosos (copiados fieles del archivo, para revisión)

- **BULGARA CONTRALATERAL 7 × 7** en la semana 2 de `5° Mesociclo -
  Intensificare` (en los 3 archivos: base, Cesar, alma G). Las semanas 1/3/4
  son 3×6, 3×8 y 2×6. ¿Es real o un error del archivo? Preguntar a Yohan.
- **112 cargas con ≥ 6 decimales** (73 valores distintos), p. ej.
  `67.28571428571429`, `125.55000000000001`, `102.16216216216215`,
  `42.66666666666667`. Son cálculos del Excel (redondear a 1 decimal al
  cargar a la plataforma). Están en `carga_kg_fuente` y en `rm_referencia`.
- **"PANTORRILLAS SAFETY BAR  202"** — el "202" del nombre no se tocó
  (archivo `4 Mesociclo - Aprendiendo a ser Fuertes-GEra!.xlsx`). ¿Es un
  código o un error?
- **Typo "Mesosciclo"** en 45 nombres de archivo; se conserva tal cual en el
  nombre canónico (Yohan decide si se corrige a "Mesociclo").
- **PRESS BANCA ×2 en el mismo día** (`2° Mesociclo - PERFECCIONAMIENTO
  TECNICO`, DÍA C): dos bloques del mismo ejercicio — 1×15-20 al 50 % con
  "Serie Bilbo" y TOP SET RAMPING ×5 + VOLUME SET TEST AMRAP. Es legítimo,
  no un duplicado del parser; queda así en la plantilla.
- 75 avisos en 18 archivos (cargas del atleta que varían por serie, reps
  que no coinciden con el TOP SET…): están en el campo `avisos` de cada
  ejercicio y en `parsed/<fileid>.json`.

## Preguntas abiertas para Alfredo / Yohan

1. **¿Las cargas en libras se convierten a kg o se mantienen como
   variantes?** Hay 6 archivos en Lbs: `Preparación fuerza (lbs)`,
   `Preparación fuerza (lbs)-Poco Material`, `Reacondicionamiento (Lbs)`,
   `Maestría Tecnica (Lbs)`, `Fuerza 1-Lbs`, `Fuerza Relms 2-Lbs`. La
   plantilla canónica está en kg y las variantes en lbs están marcadas
   (`unidades: "lbs"`).
2. **¿Qué programas de cliente NO deben ser plantilla genérica?** Las
   variantes con etiqueta de cliente (GIRL, ALLY, Buho Gym, Formato 2…)
   ¿son plantillas para todos o se reservan para ese cliente? Las 6
   plantillas separadas (tabla de arriba) son las candidatas a quedar fuera
   del catálogo general.
3. **¿El PDF de "Recuperando Intensidad y Tecnica" es una versión vieja que
   se descarta?** El PDF dice "1° BLOQUE 2" y es del atleta CHECHO HM, con
   ejercicios que no están en el `.xlsx` (PIN SQUAT, EXTENSIONES DE PIERNA,
   AGREGAR HIPEREXTENSIONES). El `.xlsx` manda por defecto.
4. **Confirmar el nombre de la fusión**: ¿"6° Mesociclo-Introducción a la
   hipertrofia 1" o "6° Mesociclo-Introducción hibrida"?
5. **Confirmar el enfoque inferido de cada plantilla** (43 Técnica, 22
   Fuerza, 3 Hipertrofia, 1 Transición): está en `enfoque_original` con el
   motivo de la inferencia.
6. **¿El 7 × 7 de BULGARA CONTRALATERAL (Intensificare, semana 2) es real?**
7. **¿Se corrige el typo "Mesosciclo" → "Mesociclo" en los nombres?**

## Archivos y trazabilidad

- **Salida** (esta carpeta): `index.json` + 69 JSON de plantilla +
  `ejercicios-distintos.json` + `README.md` (esquema) + este resumen.
- **Fuente**: `../buho-way-2026/originales/` (119 `.xlsx` descargados de
  Drive), `../buho-way-2026/mapping.json` (fileId → ruta),
  `../buho-way-2026/fuente_a_plantilla.json` (archivo → plantilla).
- **Intermedio**: `../buho-way-2026/parsed/` (1 JSON por archivo) +
  `parsed_index.json` (resumen por archivo: nº de ejercicios, semanas,
  firma de contenido).
- **Código**: `../buho-way-2026/parse_buho.py` (parser) y
  `../buho-way-2026/build_templates.py` (constructor de plantillas).
- **Inventario inicial**: `../buho-way-2026-inventory.json`.
