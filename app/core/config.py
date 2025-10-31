"""
Configuración de la aplicación. Carga parámetros desde variables de entorno
usando Pydantic para que sea fácil de tipar y extender. Este archivo se
inspira en el diseño del repositorio original `tep`.
"""

import os
from pydantic import BaseModel


class Settings(BaseModel):
    """Almacena los parámetros de la base de datos. Se pueden
    sobreescribir mediante variables de entorno.
    """

    DB_NAME: str = os.getenv("DB_NAME", "graymayabd")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", 3306))


settings = Settings()

# Clave de API para proteger las rutas. En entornos de desarrollo se puede
# dejar la predeterminada, pero en producción se recomienda modificarla.
API_KEY = os.getenv("API_KEY", "dev_key_gms_330455")

# Orígenes permitidos para CORS. Se configuran como una lista separada por
# comas en la variable de entorno CORS_ORIGINS.
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost,http://localhost:5173,http://localhost:3000"
).split(",")