# Especificación de la API (Multi-Tenant)

Este documento detalla los contratos de la API expuesta por el servidor a través de Cloudflare. Todos los endpoints deben ser consumidos de manera estricta utilizando el cliente HTTP nativo implementado en el Frontend.

**Base URL (Ejemplo):** `https://downloaded-violations-remains-everyday.trycloudflare.com`

---

## 1. Obtener la lista de TODAS las Bases de Datos

Retorna los metadatos de los proyectos (tenants) registrados en el servidor.

- **Ruta:** `/api/projects`
- **Método HTTP:** `GET`
- **Payload Completo de Entrada:** Ninguno.

### Matriz de Respuestas y Errores

**`200 OK` (Éxito)**
```json
{
  "data": [
    {
      "name": "agromap",
      "title": "AgroMap",
      "description": "Sistema de gestión agrícola, sectores, asociadas y visitas",
      "database_type": "SQLite",
      "api_base": "/api/agromap",
      "tables_url": "/api/agromap/data"
    },
    {
      "name": "proyecto_b",
      "title": "Bitácora de Mantenimiento Vehicular",
      "description": "Gestión de vehículos, salud de componentes, categorías y registros de mantenimiento",
      "database_type": "PostgreSQL",
      "api_base": "/api/mantenimiento",
      "tables_url": "/api/proyecto_b/data"
    }
  ]
}
```

**`500 Internal Server Error`**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "No se pudo leer el directorio de bases de datos del servidor."
  }
}
```

---

## 2. Inspeccionar las tablas de una base de datos específica

Retorna la estructura y las tablas disponibles dentro de un tenant.

- **Ruta:** `/api/{nombre_proyecto}/data`
- **Método HTTP:** `GET`
- **Payload Completo de Entrada:** Parámetro en la URL (`nombre_proyecto`).

### Matriz de Respuestas y Errores

**`200 OK` (Éxito)**
```json
{
  "data": {
    "database_type": "SQLite",
    "project": "agromap",
    "tables": [
      "sectores",
      "asociadas",
      "visitas"
    ]
  }
}
```

**`404 Not Found`**
```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "El proyecto especificado no existe o la base de datos no está disponible."
  }
}
```

---

## 3. Consultar el contenido de las tablas

Retorna los registros específicos de una tabla dentro del tenant.

- **Ruta:** `/api/{nombre_proyecto}/{table_name}`
- **Método HTTP:** `GET`
- **Payload Completo de Entrada:** Parámetros en la URL. Opcionalmente soporte para paginación (`?page=1&limit=50`).

### Matriz de Respuestas y Errores

**`200 OK` (Éxito)**
```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Sector A",
      "creado_en": "2023-10-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1
  }
}
```

**`404 Not Found`**
```json
{
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "La tabla solicitada no existe en el esquema del proyecto."
  }
}
```

---

## 4. Obtener Métricas del Dashboard (Simulación / Agregado)

Endpoint específico para alimentar los KPIs de la vista individual del tenant.

- **Ruta:** `/api/{nombre_proyecto}/dashboard`
- **Método HTTP:** `GET`
- **Payload Completo de Entrada:** Parámetro de ruta.

### Matriz de Respuestas y Errores

**`200 OK` (Éxito)**
```json
{
  "data": {
    "active_connections": 12,
    "queries_per_minute": 340,
    "storage_used_mb": 45.5,
    "recent_errors_count": 2
  }
}
```
