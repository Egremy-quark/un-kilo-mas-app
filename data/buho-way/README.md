# Plantillas Buho Way 2026 — formato canónico para Un Kilo Más

69 plantillas canónicas construidas a partir de los 119 archivos `.xlsx` de la
carpeta de Google Drive **Buho Way 2026** (121 archivos en el inventario; 2
eran temporales de Excel y se saltaron). Cada plantilla es un programa único
(mesociclo/microciclo) con sus variantes documentadas, no una copia por
cliente.

Generado con `../buho-way-2026/build_templates.py` a partir de
`../buho-way-2026/parsed/*.json` (parser `../buho-way-2026/parse_buho.py`).
No se escribió nada en la plataforma ni en Drive: solo lectura y archivos
nuevos en el workspace.

## Archivos de esta carpeta

| Archivo | Contenido |
|---|---|
| `index.json` | Lista completa de las 69 plantillas (id, nombre, fase, semanas, enfoque, nº de días/ejercicios/variantes/archivos fuente). |
| `f<fase>-<slug>.json` | Una plantilla canónica por archivo (69). |
| `ejercicios-distintos.json` | Inventario de los 396 ejercicios distintos (nombre_clave + grafía más común + nº de plantillas). Pendiente de emparejar con la biblioteca de la plataforma (121 ejercicios). |
| `README.md` | Este archivo (esquema). |
| `RESUMEN-BUHO-WAY.md` | Reporte: conteos, decisiones de dedup, archivos saltados, preguntas abiertas. |

El mapa archivo-fuente → plantilla está en
`../buho-way-2026/fuente_a_plantilla.json`. Los Excel originales están en
`../buho-way-2026/originales/` y el parse intermedio en
`../buho-way-2026/parsed/` (+ `parsed_index.json`).

## Esquema de una plantilla (`f*.json`)

```json
{
  "id": "f4-2-mesosciclo-preparacion-fuerza",
  "nombre": "2° Mesosciclo - Preparación fuerza",
  "nombre_alias": [],
  "fase": "Fase 4- Macrociclo 2 - BIIO Evolucionado",
  "fase_corta": "BIIO Evolucionado",
  "semanas": 3,
  "enfoque": "Fuerza",
  "enfoque_original": "inferido: resto (fuerza por defecto)",
  "estado": "Borrador",
  "dias": [
    {
      "codigo": "A",
      "titulo": "ENTRENAMIENTO A : PIERNAS - FEMORALES - HOMBROS - ABDOMEN - GLUTEO",
      "hoja": "Día A",
      "enfoque_dia": "PIERNAS - FEMORALES - HOMBROS - ABDOMEN - GLUTEO",
      "instrucciones_sesion": {"1": "Intenta completar las repeticiones pautadas..."},
      "ejercicios": [ { ... } ],
      "avisos": []
    }
  ],
  "variantes": [ { ... } ],
  "archivos_fuente": [ { "archivo": "...xlsx", "drive_id": "...", "fase": "...",
                          "variante": "CARLOS", "atleta": "Carlos",
                          "n_ejercicios": 18, "semanas": 3, "firma": "..." } ],
  "notas": "Plantilla canónica construida a partir del archivo de referencia '...'. ...",
  "revision": [ "Subgrupo separado de '...': coincidencia 15% con la plantilla base." ]
}
```

### Campos

- **`id`**: slug `f<fase>-<nombre>`. La fase es el número de la carpeta
  (1 En Casa, 2 Aprender a Moverse, 3 Aprendiendo Fuerza / Introducción a la
  Fuerza, 4 BIIO Evolucionado, 5 EL CAMINO, 6 Bloques de Power).
- **`nombre`**: nombre canónico del programa (sin sufijos de cliente,
  población, material, unidades ni "Formato 2"). Los subgrupos separados
  llevan el distintivo entre paréntesis, p. ej. `… (Formato 2)`,
  `… (Búho Gym)`, `… (GIRL)`, `… (ALLY)`.
- **`nombre_alias`**: nombres de archivo con el mismo contenido que se
  fusionaron (p. ej. `6° Mesociclo-Introducción hibrida` =
  `6° Mesociclo-Introducción a la hipertrofia 1`).
- **`fase` / `fase_corta`**: carpeta de Drive tal cual / nombre corto.
  Encaja en la jerarquía Fase → Plantilla → Variante que se pidió para el
  panel de Plantillas.
- **`semanas`**: nº de semanas del programa (posición de la columna de
  sesión; la última semana puede ser descarga).
- **`enfoque`**: Fuerza / Hipertrofia / Transición / Técnica. **Inferido**
  del nombre y los títulos de día (ver `enfoque_original` con el motivo);
  revisable por Yohan. Regla: "introducción" → Técnica; "hipertrofia" →
  Hipertrofia; "transición" → Transición; técnica/maestría/perfeccionamiento/
  aprender a moverse/en casa/escalera/reacondicionamiento/IF → Técnica;
  resto → Fuerza.
- **`estado`**: siempre `Borrador` (nada se publica sin revisión).
- **`dias[].codigo`**: A/B/C (o el código del título de la hoja).
- **`dias[].instrucciones_sesion`**: instrucciones por sesión (clave = nº de
  sesión como texto, p. ej. `"1"`, `"2"`), copiadas del archivo.
- **`dias[].ejercicios[]`**: ver abajo.
- **`variantes[]`**: versiones del mismo programa (cliente, población,
  material, unidades) con sus diferencias respecto a la plantilla.
- **`archivos_fuente[]`**: todos los archivos que alimentan la plantilla.
- **`notas`**: procedencia y advertencia sobre las cargas.
- **`revision`**: notas de revisión (subgrupo separado, alias fusionado,
  avisos del archivo de referencia).

### Ejercicio

```json
{
  "nombre_original": "SENTADILLA CON BARRA",
  "nombre": "Sentadilla con barra",
  "nombre_clave": "SENTADILLA CON BARRA",
  "seccion": "principal",
  "componentes": [],
  "superconjunto_con": null,
  "rm_referencia": {"tipo": "1RM", "valor": "100", "unidad": null},
  "notas": "",
  "video_url": null,
  "tiene_tutorial": false,
  "prescripcion": [ { ... } ],
  "subprescripciones": [ { "nombre": "Volume Sets", "prescripcion": [ ... ] } ],
  "avisos": [ "semana 1: cargas del atleta varían por serie (70, 65 kg); sin carga única en plantilla" ]
}
```

- **`nombre_original`**: exacto como está en el archivo (español, mayúsculas).
- **`nombre`**: mismo nombre en formato título (para mostrar en la app).
- **`nombre_clave`**: sin acentos, en mayúsculas, para emparejar con la
  biblioteca de ejercicios de la plataforma.
- **`seccion`**: `principal` o `calentamiento`.
- **`componentes`**: sub-filas `+...` del ejercicio (componentes de superserie).
- **`superconjunto_con`**: nombre del ejercicio con el que se alterna
  (superserie/biserie/triserie/circuito), o `null`.
- **`rm_referencia`**: referencia de RM del archivo (`1RM`, `8RM`, `90%RM`,
  `RM`) con su valor. El valor es el del atleta del archivo de referencia;
  **no es prescripción**, es contexto. Puede venir con decimales largos
  calculados (p. ej. `113.33333333333333`): se copia tal cual, redondear al
  cargar a la plataforma.
- **`notas`**: notas del archivo para ese ejercicio.
- **`video_url` / `tiene_tutorial`**: `null`/`false` en todos (ningún archivo
  trae hipervínculos de tutorial; el campo existe para cuando se añadan).
- **`avisos`**: advertencias del parser para ese ejercicio (cargas que
  varían, reps que no coinciden con el TOP SET, etc.).

### Prescripción (una por semana)

```json
{
  "semana": 1,
  "sesion": "1°",
  "descarga": false,
  "series": "3",
  "reps": "8/6/4",
  "metodo": null,
  "prescripcion_texto": "3 x 8/6/4",
  "porcentaje_rm": "0.75",
  "carga_kg_fuente": null,
  "carga_kg_fuente_origen": null,
  "carga_texto": null,
  "descanso": "2'00\"",
  "notas": null,
  "cargas_kg_registro": ["75", "75", "75"]
}
```

- **`semana`**: nº de semana (1..N). **`sesion`**: etiqueta original de la
  columna (`1°`, `4°`, `Semana 1`, …) como trazabilidad.
- **`descarga`**: `true` si es la semana de descarga (`SEMANA DESCARGA` o
  instrucción de descarga en la sesión).
- **`series` / `reps`**: texto exacto del archivo. `reps` puede ser un rango
  (`10 a 12`), una lista (`8/6/4`, `15/12/10`), `AMRAP`, un método
  (`MYO SET`, `RAMPING x 5`) o `null`.
- **`metodo`**: método cuando va en una celda aparte (p. ej. `CLUSTER`,
  `MYO SET`, `REST PAUSE`).
- **`prescripcion_texto`**: `series x reps` legible (p. ej. `3 x 8/6/4`).
- **`porcentaje_rm`**: % de RM de la fila RM (fracción, p. ej. `0.75` = 75 %).
  Es la prescripción de intensidad del programa.
- **`carga_kg_fuente`**: carga en kg **solo** cuando el archivo la da como
  prescripción (no como registro del atleta): fila de Notas con "Carga
  recomendada (kg)", o cargas del atleta únicas e idénticas en todas las
  series de esa semana. `carga_kg_fuente_origen` dice de dónde salió.
  Si es `null`, la plantilla no prescribe carga: se usa el % de RM.
- **`carga_texto`**: RPE/RIR u otra indicación de intensidad en texto
  (p. ej. `RPE-8`, `RIR-3`).
- **`descanso`**: descanso entre series (texto del archivo, p. ej. `2'00"`,
  `3:00 a 4:00 min`).
- **`notas`**: nota de esa semana para ese ejercicio.
- **`cargas_kg_registro`**: Kg que el atleta registró en sus series
  (filas "Serie 1.", "1° SET", etc.). **No es prescripción**: es el registro
  del atleta del archivo de referencia. Sirve para ver qué cargas se usaron,
  no para pautarlas.

### Subprescripciones

Segunda prescripción del mismo ejercicio en la misma semana: `TOP SET`,
`Volume Sets` / `VOLUME SETS`, `BACK OFF` / `BACK UP`, `SERIE ALTERNA`,
`FASE 1. SERIE DE VOLUMEN`, `FASE 2. VOLUME SETS`, `FASE 3. BACK OFF SETS`,
`SERIES DE TRABAJO`. Cada una tiene su propia lista de prescripciones por
semana con el mismo formato.

### Variante

```json
{
  "etiqueta": "CARLOS",
  "etiquetas": ["CARLOS"],
  "unidades": "kg",
  "archivos": ["2 Mesosciclo - Preparación fuerza-Carlos.xlsx"],
  "atleta": "Carlos",
  "coincidencia_posicional_pct": 89,
  "sustituciones": [
    {"dia": "A", "posicion": 4, "en_plantilla": "PRESS DE HOMBRO (MANCUERNAS)", "en_variante": "ELEVACIONES LATERALES"}
  ],
  "ejercicios_solo_variante": [],
  "ejercicios_solo_plantilla": [],
  "prescripcion_diferente": [
    {"dia": "B", "posicion": 3, "ejercicio": "FONDOS (O PRESS FRANCES)",
     "semanas": {"1": {"plantilla": "3 x 8/6/4", "variante": "3 x 10"}}}
  ]
}
```

- **`etiqueta`**: lo que se quitó del nombre del archivo (cliente,
  población, material, unidades). **`unidades`**: `kg` o `lbs`.
- **`coincidencia_posicional_pct`**: % de posiciones (día/ejercicio) con
  series/reps/%/método idénticos a la plantilla.
- **`sustituciones`**: ejercicios que cambian de nombre en la misma
  posición (el programa es el mismo, el accesorio cambia).
- **`ejercicios_solo_variante` / `ejercicios_solo_plantilla`**: ejercicios
  que solo están en un lado.
- **`prescripcion_diferente`**: posiciones donde cambian las series/reps,
  con los valores de cada lado por semana.

## Reglas de agrupación (dedup)

1. Se agrupa por **nombre canónico**: se quitan del nombre del archivo los
   sufijos/prefijos de cliente (Buho Gym, Carlos, Marialy, Clau, Cesar,
   Gera, Alberto, Marko, Nayee, Jorge, Otho, Eí, Saraí Molina, Iris Janeth,
   Lu, Alma G, Eduardo Besares, Kechas, Ale Diaz, Lupita Lu, Yohan, Juan
   Reyes, Ally, Lalee, Checho HM, MiMix, Gerardo, Sofi, Lupe…), población
   (Mujeres, Hombres, Girls, Girl, Niñas), material (Poco Material, Sin
   Máquinas), unidades (Lbs) y formato (Formato 2). También se normaliza el
   ordinal inicial (`7 Mesociclo` = `7° Mesociclo`) y artefactos de tecleo
   (`Peaking+}TAPPER` = `Peaking+TAPPER`, `-GEra!` = `-GEra`).
2. Dos nombres distintos con el **mismo contenido** (misma firma) y la misma
   fase se fusionan en una sola plantilla (1 caso: `Introducción hibrida` =
   `Introducción a la hipertrofia 1`).
3. Dentro de un nombre, un archivo se separa como **plantilla propia** si su
   coincidencia posicional (series/reps) con el archivo de referencia es
   **< 60 %**, o si lleva etiqueta de formato/material distinto (Formato 2,
   Sin Máquinas) y su coincidencia es < 70 %. Además, un archivo que coincide
   ≥ 70 % con un archivo separado (y menos con la referencia) se mueve al
   subgrupo separado (caso "Saraí Molina", Formato 2 por contenido aunque su
   nombre no lo diga). 6 subgrupos separados (ver RESUMEN).
4. La plantilla canónica toma el contenido del **archivo de referencia** (el
   archivo base sin etiquetas; si no hay, el de más ejercicios). Las
   variantes documentan sus diferencias sin alterar la plantilla.

## Reglas de parseo (resumen)

- Semana = posición de la columna de sesión (o Nº si dice "Semana N").
- Las filas "Serie N.", "1° SET", "TEST 1 RM", "MYO…", "N° Rep" son
  **registro del atleta**, no prescripción. Los Kg de esas filas van a
  `cargas_kg_registro` y solo se promueven a `carga_kg_fuente` si son únicos
  e idénticos en todas las series de esa semana.
- Las sub-filas TOP SET / VOLUME SETS / BACK OFF / BACK UP / SERIE ALTERNA /
  FASE N. / SERIES DE TRABAJO van a `subprescripciones`.
- La fila "Intensidad:" (% y RPE) y la fila "30\"" (descanso + RIR) se
  aplican al ejercicio actual.
- El formato "ALTERNAR DOS EJERCICIOS" con "2 SERIES" en el encabezado:
  los ejercicios del bloque traen solo las reps; las series son 2.
- Hojas `Portada` (registros del atleta) y `TOMA DE MARCAS` (día de testeo)
  se saltan: no son días de entreno.
- Lo dudoso va como `null` con nota/aviso; los valores sospechosos del
  archivo se copian fieles y se listan en RESUMEN-BUHO-WAY.md.

## Para cargar a la plataforma

- Estado inicial: `Borrador` en todas. Nada se publica sin que Yohan revise.
- La plantilla encaja en el modelo de Plantillas (nombre, semanas, enfoque,
  días con ejercicios y prescripción) y en la jerarquía Fase → Plantilla →
  Variante.
- `nombre_clave` es la llave para emparejar cada ejercicio con la biblioteca
  de la plataforma (121 ejercicios). Ver `ejercicios-distintos.json` y la
  lista de pendientes en RESUMEN-BUHO-WAY.md.
- Las cargas en `lbs` (6 archivos) están marcadas en sus variantes
  (`unidades: "lbs"`); la plantilla canónica está en kg. Decidir con Yohan
  si se convierten o se mantienen como variantes en lbs.
- Los valores de `carga_kg_fuente` y `rm_referencia.valor` con decimales
  largos (p. ej. `60.133333333333326`) son cálculos del Excel; redondear a
  1 decimal al cargar.
