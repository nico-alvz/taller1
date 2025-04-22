# StreamFlow API - Módulos de Autenticación y Usuarios

API monolítica modular para la plataforma de streaming StreamFlow, desarrollada como parte del Taller 1 de Arquitectura de Sistemas. Esta implementación corresponde a los módulos de Autenticación y Usuarios.

## Requisitos

- Node.js v18.x o superior
- Docker y Docker Compose
- PostgreSQL (módulo de autenticación)
- MySQL (módulo de usuarios)

## Instalación

1. **Clonar el repositorio e instalar dependencias**:
   ```bash
   git clone [url-repositorio]
   cd streamflow-api
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con las credenciales necesarias
   ```

3. **Iniciar bases de datos con Docker**:
   ```bash
   docker-compose up -d
   ```

4. **Verificar conexiones a bases de datos**:
   ```bash
   npm run test:db
   ```

5. **Ejecutar migraciones y seeds**:
   ```bash
   npm run migrate
   npm run seed
   ```

## Uso

### Iniciar el servidor

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start
```


# Verificar conexiones a bases de datos
npm run test:db
```

## Estructura del Proyecto

```
.
├── src/
│   ├── config/         # Configuración de bases de datos
│   ├── controllers/    # Lógica de negocio
│   ├── models/        # Modelos de datos
│   ├── routes/        # Definición de rutas
│   ├── utils/         # Middlewares y utilidades
│   └── server.js      # Punto de entrada
├── tests/             # Pruebas automatizadas
├── docker-compose.yml # Configuración de Docker
└── .env.example      # Plantilla de variables de entorno
```

## Endpoints

### Módulo de Autenticación

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/auth/login` | Iniciar sesión | Público |
| PATCH | `/auth/usuarios/:id` | Actualizar contraseña | Autenticado |

### Módulo de Usuarios

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/usuarios` | Crear usuario | Público/Admin* |
| GET | `/usuarios/:id` | Obtener usuario | Autenticado |
| PATCH | `/usuarios/:id` | Actualizar usuario | Autenticado |
| DELETE | `/usuarios/:id` | Eliminar usuario | Admin |
| GET | `/usuarios` | Listar usuarios | Admin |

*La creación de usuarios administradores requiere autenticación de administrador

## Credenciales por Defecto

**Administrador**:
- Email: admin@streamflow.com
- Password: Admin123!

## Tests Automatizados

El proyecto incluye un script de pruebas automatizadas que verifica todos los endpoints de los módulos de Autenticación y Usuarios. Para ejecutar las pruebas:

1. Asegúrate de que el servidor esté corriendo
2. Ejecuta el script de pruebas:
   ```bash
   ./tests/api_test.sh
   ```

El script probará:
- Autenticación: login, cambio de contraseña
- Usuarios: creación, lectura, actualización y eliminación
- Validación de roles y permisos
- Manejo de errores

Los resultados se mostrarán en la consola con indicadores visuales de éxito/fallo.

