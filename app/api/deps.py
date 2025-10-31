"""
Dependencias comunes para las rutas de la API. En particular, se define
una dependencia para validar una API Key enviada mediante el encabezado
HTTP `X-API-KEY`. Si la clave no coincide con la configurada se
responderá con un error 403.
"""

from fastapi import HTTPException, Security
from fastapi.security.api_key import APIKeyHeader

from app.core.config import API_KEY


api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)


def get_api_key(api_key_header: str = Security(api_key_header)) -> str:
    """Valida que la clave proporcionada en el encabezado sea correcta.

    Args:
        api_key_header: valor del encabezado X-API-KEY.

    Returns:
        La misma clave si es válida.

    Raises:
        HTTPException: si la clave es incorrecta o no se proporciona.
    """
    if API_KEY and api_key_header != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key_header