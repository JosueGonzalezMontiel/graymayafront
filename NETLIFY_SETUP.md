## Desarrollo local

Para desarrollo local con Netlify CLI:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Crear archivo .env local (no subir a git)
echo "API_BASE=https://api" > .env
echo "API_KEY=tu_clave_api_aqui" >> .env

# Ejecutar en modo desarrollo
netlify dev
```

Esto iniciará un servidor local que simula el entorno de Netlify con las funciones serverless.
