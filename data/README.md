# /data — JSON Database Layer

Esta carpeta funciona como la capa de persistencia del sistema. Cada archivo `.json` representa una coleccion.

## Reglas

- Un archivo por coleccion (singular, kebab-case).
- Cada archivo debe tener `_meta` y `records`.
- IDs con prefijo de coleccion: `ex_001`, `usr_001`.
- Maximo recomendado: 5 MB por archivo.
- Los esquemas Zod van en `_schema/`.
- Los backups automaticos van en `_backups/` (gitignored).
