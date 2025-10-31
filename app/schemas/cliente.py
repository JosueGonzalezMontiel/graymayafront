"""
Esquemas Pydantic para clientes. El esquema de respuesta oculta la
contraseña por razones de seguridad.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class ClienteBase(BaseModel):
    """Campos base para los clientes."""

    nombre: str = Field(..., max_length=100, description="Nombre completo del cliente")
    telefono: Optional[str] = Field(
        None, max_length=20, description="Número de teléfono"
    )
    email: Optional[str] = Field(
        None, max_length=100, description="Correo electrónico (único)"
    )
    direccion: Optional[str] = Field(
        None, max_length=255, description="Dirección del cliente"
    )
    usuario: str = Field(
        ..., max_length=50, description="Nombre de usuario (único)"
    )
    password: str = Field(
        ..., min_length=1, description="Contraseña en formato hash"
    )
    es_admin: Optional[bool] = Field(False, description="Indica si es administrador")

    class Config:
        orm_mode = True
        from_attributes = True


class ClienteCreate(ClienteBase):
    """Esquema para crear un cliente."""
    pass


class ClienteUpdate(BaseModel):
    """Esquema para actualizar un cliente (todos los campos opcionales)."""

    nombre: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    direccion: Optional[str] = Field(None, max_length=255)
    usuario: Optional[str] = Field(None, max_length=50)
    password: Optional[str] = Field(None, min_length=1)
    es_admin: Optional[bool] = Field(None)

    class Config:
        orm_mode = True
        from_attributes = True


class ClienteOut(BaseModel):
    """Esquema de salida para un cliente (sin exponer contraseña)."""

    cliente_id: int = Field(..., description="Identificador del cliente")
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    usuario: str
    es_admin: bool

    class Config:
        orm_mode = True
        from_attributes = True


class ClienteList(BaseModel):
    """Esquema para respuestas paginadas de clientes."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[ClienteOut]