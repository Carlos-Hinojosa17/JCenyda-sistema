# 🚀 Deploy del Sistema de Ventas JC en Render.com

Este proyecto está configurado para desplegarse automáticamente en Render.com con un setup completo de frontend y backend.

## 📋 Pre-requisitos

- Cuenta en [Render.com](https://render.com) (gratuita)
- Repositorio en GitHub con el código
- Cuenta en Supabase (base de datos)

## 🏗️ Arquitectura del Deploy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   React + Vite  │───▶│  Node.js + API  │───▶│   PostgreSQL    │
│   Static Site   │    │   Web Service   │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Pasos para Deploy

### 1. **Preparar el repositorio**
```bash
# Asegúrate de que todos los cambios estén commiteados
git add .
git commit -m "Preparación para deploy en Render"
git push origin main
```

### 2. **Configurar Backend en Render**

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio GitHub
4. Configuración:
   - **Name**: `jc-backend`
   - **Root Directory**: `backend-jc`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. **Variables de entorno** (Environment Variables):
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu_supabase_service_role_key
   JWT_SECRET=tu_jwt_secret_muy_seguro
   ```

### 3. **Configurar Frontend en Render**

1. En Render Dashboard → **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio
3. Configuración:
   - **Name**: `jc-frontend`
   - **Root Directory**: `frontend-jc`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Variables de entorno**:
   ```
   VITE_API_URL=https://jc-backend.onrender.com
   ```

### 4. **Configurar Custom Domain** (Opcional)

Si tienes un dominio propio:
1. Ve a tu servicio frontend → **Settings** → **Custom Domains**
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

## 🔧 Variables de Entorno Detalladas

### Backend (`jc-backend`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor | `10000` |
| `SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Service Role Key de Supabase | `eyJhbGciOiJIUzI1NiIs...` |
| `JWT_SECRET` | Clave para firmar tokens | `clave_muy_segura_y_larga` |

### Frontend (`jc-frontend`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `https://jc-backend.onrender.com` |

## 🛠️ Configuración Automática

El proyecto incluye:

- **render.yaml**: Configuración de infraestructura como código
- **CORS automático**: Configurado para dominios de Render
- **Detección de entorno**: Frontend se adapta automáticamente
- **Rate limiting**: Optimizado para producción

## 🌐 URLs Finales

Después del deploy tendrás:

- **Frontend**: `https://jc-frontend.onrender.com`
- **Backend API**: `https://jc-backend.onrender.com/api`
- **Health Check**: `https://jc-backend.onrender.com/test-db`

## 🐛 Troubleshooting

### Error de CORS
- Verifica que el dominio del frontend esté en la configuración CORS del backend
- Revisa las variables de entorno `CORS_ORIGINS`

### Error 429 (Too Many Requests)
- El rate limiting está configurado para producción
- En desarrollo es más permisivo

### Error de conexión a Supabase
- Verifica que `SUPABASE_URL` y `SUPABASE_KEY` sean correctas
- Asegúrate de usar la Service Role Key, no la anon key

### Frontend no carga datos
- Verifica que `VITE_API_URL` apunte al backend correcto
- Revisa los logs del backend para errores CORS

## 📊 Monitoreo

Render proporciona:
- **Logs en tiempo real**: Para debugging
- **Métricas de performance**: CPU, memoria, requests
- **Health checks**: Monitoreo automático
- **Alertas**: Por email en caso de fallos

## 🔄 Auto-Deploy

- **Push to main**: Deploy automático en cada commit
- **Build logs**: Visible en el dashboard
- **Rollback**: Posible desde el dashboard
- **Environment sync**: Cambios de variables requieren restart

## 📞 Soporte

- [Documentación oficial de Render](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Logs del proyecto](https://dashboard.render.com) → Tu servicio → Logs

---

**¡Tu Sistema de Ventas JC estará listo en producción en menos de 10 minutos!** 🎉