# Sistema de Ventas JC - Frontend

Frontend desarrollado en React para el sistema de ventas JC.

## Tecnologías utilizadas

- **React 18** - Biblioteca de JavaScript para construir interfaces de usuario
- **Vite** - Herramienta de desarrollo rápido para aplicaciones web modernas
- **React Router Dom** - Enrutamiento para aplicaciones React
- **Bootstrap 5** - Framework CSS para diseño responsivo
- **Bootstrap Icons** - Librería de iconos
- **Axios** - Cliente HTTP para APIs
- **Chart.js** - Librería para gráficos (preparada para uso futuro)

## Estructura del proyecto

`
src/
 layouts/
    Lateral.jsx          # Layout principal con sidebar
 paginas/
    Login.jsx            # Página de login
    Principal.jsx        # Dashboard principal
    Productos.jsx        # Gestión de productos
    Clientes.jsx         # Gestión de clientes
    Almacen.jsx          # Control de inventario
    Venta.jsx            # Procesamiento de ventas
 App.jsx                  # Configuración de rutas
`

## Características

### Módulos implementados:
-  **Login** - Autenticación de usuarios
-  **Dashboard** - Vista general con métricas
-  **Productos** - CRUD de productos
-  **Clientes** - CRUD de clientes  
-  **Almacén** - Control de inventario
-  **Ventas** - Procesamiento de ventas

### Funcionalidades:
- Navegación con React Router
- Layout responsivo con Bootstrap
- Sidebar de navegación
- Diseño limpio y profesional
- Preparado para conexión con backend

## Instalación y ejecución

1. Instalar dependencias:
`ash
npm install
`

2. Ejecutar en modo desarrollo:
`ash
npm run dev
`

3. Construir para producción:
`ash
npm run build
`

## Rutas de la aplicación

- / - Página de login
- /layouts/principal - Dashboard principal
- /layouts/producto - Gestión de productos
- /layouts/cliente - Gestión de clientes
- /layouts/almacen - Control de almacén
- /layouts/venta - Realizar ventas

## Estado del proyecto

 **Completado**: Estructura básica y navegación
 **Pendiente**: Conexión con backend
 **Pendiente**: Funcionalidades CRUD completas
 **Pendiente**: Validaciones y manejo de errores

## Notas para desarrollo

- Los componentes están listos para conectar con APIs
- Todos los datos están preparados para ser dinámicos
- Se utiliza Bootstrap para mantener consistencia visual
- El código está limpio y sin datos predeterminados
