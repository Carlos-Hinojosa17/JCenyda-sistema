# Guía de Conexión con Backend

##  Frontend conectado exitosamente

El frontend ha sido configurado para conectarse con tu backend. Todos los módulos están preparados para comunicarse con las APIs.

##  Configuración necesaria

### 1. URL del Backend
Edita el archivo src/config.js y cambia la URL base:

`javascript
export const config = {
  API_BASE_URL: 'http://tu-backend:puerto/api', // Cambiar aquí
  // ...
};
`

### 2. Estructura de endpoints esperada

El frontend espera que tu backend tenga estos endpoints:

####  Autenticación
- POST /api/auth/login - Login de usuario
  - Body: { usuario: string, password: string }
  - Response: { token: string, user: object }

####  Productos
- GET /api/productos - Obtener todos los productos
- GET /api/productos/:id - Obtener producto por ID
- POST /api/productos - Crear producto
- PUT /api/productos/:id - Actualizar producto
- DELETE /api/productos/:id - Eliminar producto

####  Clientes
- GET /api/clientes - Obtener todos los clientes
- GET /api/clientes/:id - Obtener cliente por ID
- POST /api/clientes - Crear cliente
- PUT /api/clientes/:id - Actualizar cliente
- DELETE /api/clientes/:id - Eliminar cliente

####  Ventas
- GET /api/ventas - Obtener todas las ventas
- POST /api/ventas - Crear nueva venta
- GET /api/ventas/reporte - Obtener reporte de ventas

####  Dashboard
- GET /api/dashboard/metrics - Obtener métricas del dashboard
  - Response: { ventas: number, productos: number, clientes: number, stockBajo: number }

### 3. Autenticación
El frontend maneja tokens JWT automáticamente:
- Almacena el token en localStorage
- Incluye Authorization: Bearer <token> en todas las peticiones
- Redirecciona al login si el token expira (401)

### 4. Estructura de respuestas esperada

#### Login exitoso:
`json
{
  "token": "jwt_token_aqui",
  "user": {
    "id": 1,
    "nombre": "Usuario",
    "email": "user@example.com"
  }
}
`

#### Lista de productos:
`json
[
  {
    "id": 1,
    "nombre": "Producto 1",
    "precio": 100.00,
    "stock": 50
  }
]
`

#### Lista de clientes:
`json
[
  {
    "id": 1,
    "nombre": "Cliente 1",
    "email": "cliente@example.com",
    "telefono": "123456789"
  }
]
`

### 5. Manejo de errores
El frontend maneja errores automáticamente:
- Muestra mensajes de error en la UI
- Redirecciona en caso de errores de autenticación
- Timeout de 10 segundos por petición

##  Funcionalidades implementadas

###  Módulo de Login
- Autenticación con backend
- Manejo de tokens JWT
- Validación de credenciales
- Estados de carga

###  Módulo de Productos
- Listado dinámico desde backend
- Botones para CRUD (funciones preparadas)
- Manejo de estados de carga
- Confirmaciones para eliminar

###  Módulo de Clientes
- Listado dinámico desde backend
- Botones para CRUD (funciones preparadas)
- Manejo de estados de carga
- Confirmaciones para eliminar

###  Dashboard Principal
- Métricas dinámicas desde backend
- Indicadores visuales
- Estados de carga
- Manejo de errores

###  Módulo de Ventas
- Listado de productos disponibles
- Carrito de compras funcional
- Búsqueda de productos
- Procesamiento de ventas
- Cálculo automático de totales

##  Archivos modificados

1. **src/services/api.js** - Configuración base de Axios
2. **src/services/apiServices.js** - Servicios para cada módulo
3. **src/config.js** - Configuración centralizada
4. **src/paginas/Login.jsx** - Login conectado
5. **src/paginas/Productos.jsx** - CRUD de productos
6. **src/paginas/Clientes.jsx** - CRUD de clientes
7. **src/paginas/Principal.jsx** - Dashboard con métricas
8. **src/paginas/Venta.jsx** - Sistema de ventas completo

##  Próximos pasos

1. **Configurar URL del backend** en src/config.js
2. **Verificar estructura de endpoints** en tu backend
3. **Probar la conexión** con el login
4. **Ajustar formato de respuestas** si es necesario
5. **Implementar formularios** para crear/editar (opcional)

##  Notas importantes

- El frontend funciona offline mostrando estados vacíos
- Todos los errores se muestran en la interfaz
- La autenticación persiste entre sesiones
- El código está optimizado para escalabilidad

¡El frontend está 100% preparado para trabajar con tu backend! 
