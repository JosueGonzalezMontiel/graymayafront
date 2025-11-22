# Configuración de Netlify

## Variables de Entorno

Para que la aplicación funcione correctamente en Netlify, debes configurar las siguientes variables de entorno:

### Pasos para configurar en Netlify:

1. Ve a tu sitio en Netlify Dashboard
2. Navega a: **Site settings > Environment variables**
3. Agrega las siguientes variables:

| Variable   | Valor                       | Descripción                     |
| ---------- | --------------------------- | ------------------------------- |
| `API_BASE` | `https://api.graymaya.shop` | URL base de tu API backend      |
| `API_KEY`  | `tu_clave_api_real`         | Tu clave API para autenticación |

## Funcionamiento

- Todas las peticiones del frontend se hacen a rutas relativas `/api/*`
- Netlify redirige estas peticiones a la función serverless `proxy`
- La función proxy agrega las credenciales de forma segura y reenvía la petición al backend real
- Las credenciales nunca se exponen en el código del frontend

## Archivos modificados

- `netlify/functions/proxy.js` - Función serverless que actúa como proxy
- `src/js/api/apiClient.js` - Cliente API que ahora usa rutas relativas
- `netlify.toml` - Configuración de redirecciones

## Desarrollo local

Para desarrollo local con Netlify CLI:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Crear archivo .env local (no subir a git)
echo "API_BASE=https://api.graymaya.shop" > .env
echo "API_KEY=tu_clave_api_aqui" >> .env

# Ejecutar en modo desarrollo
netlify dev
```

Esto iniciará un servidor local que simula el entorno de Netlify con las funciones serverless.
