# Diccionario de Datos

Este documento detalla el esquema de las entidades principales que consume la aplicación, inferido a partir de las respuestas de la API. Se sigue el estándar de nombres en minúsculas y `snake_case`.

## Base de Datos (Tenants)

La API central devuelve una lista de proyectos que actúan como "Tenants" (Bases de datos independientes).

### Entidad: `project` (Tenant)

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `name` | `VARCHAR(255)` | `PRIMARY KEY, NOT NULL` | Nombre/identificador del proyecto (ej. `agromap`, `proyecto_b`). |
| `title` | `VARCHAR(255)` | `NOT NULL` | Título legible de la aplicación (ej. `Bitácora de Mantenimiento Vehicular`). |
| `description` | `TEXT` | `NULLABLE` | Descripción de la funcionalidad y contexto del proyecto. |
| `database_type` | `VARCHAR(50)` | `NOT NULL` | Motor de persistencia del proyecto (ej. `SQLite`, `PostgreSQL`). |
| `api_base` | `VARCHAR(255)` | `NOT NULL` | Prefijo de ruta base para la API del tenant (ej. `/api/mantenimiento`). |
| `tables_url` | `VARCHAR(255)` | `NOT NULL` | URL relativa para inspeccionar el esquema de tablas. |

---

## Esquema Dinámico por Tenant

Cada Tenant devuelve su estructura y contenido mediante los endpoints específicos.

### Entidad: `project_schema`

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `database_type` | `VARCHAR(50)` | `NOT NULL` | Motor de base de datos utilizado (ej. `SQLite`). |
| `project` | `VARCHAR(255)` | `FK (project.name), NOT NULL` | Referencia al proyecto al que pertenece este esquema. |
| `tables` | `ARRAY(VARCHAR)` | `NOT NULL` | Lista de nombres de las tablas disponibles (ej. `["sectores", "asociadas", "visitas"]`). |

---

## Tablas Genéricas (Contenido)

Las tablas específicas como `sectores`, `asociadas` y `visitas` devuelven su contenido de manera dinámica. Al no tener el esquema rígido en este documento, se define la estructura genérica para el visor de tablas del Frontend.

### Entidad (Memoria): `table_data_response`

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `columns` | `ARRAY(VARCHAR)` | `NOT NULL` | Nombres de las columnas que conforman la tabla seleccionada. |
| `rows` | `ARRAY(JSON)` | `NOT NULL` | Matriz de registros, donde cada registro es un par clave-valor mapeado a `columns`. |
| `total_count` | `INTEGER` | `NOT NULL` | Número total de registros para paginación. |

---

## Métricas (Dashboard)

### Entidad (Memoria): `metrics_summary`

| Nombre de Columna | Tipo de Datos Exacto | Restricciones | Regla de Negocio / Descripción Detallada |
| :--- | :--- | :--- | :--- |
| `active_connections` | `INTEGER` | `NOT NULL` | Conexiones simultáneas a la base de datos (simuladas o reales). |
| `queries_per_minute` | `INTEGER` | `NOT NULL` | Tasa de consultas por minuto. |
| `storage_used_mb` | `NUMERIC(10, 2)` | `NOT NULL` | Peso en disco consumido por el archivo `.db`. |
| `recent_errors_count`| `INTEGER` | `NOT NULL` | Número de errores críticos en los logs recientes. |
