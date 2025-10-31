"""
Esquemas Pydantic para tallas.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class TallaBase(BaseModel):
    """Campos base para tallas."""

    nombre_talla: str = Field(
        ..., max_length=10, description="Nombre de la talla (ej. CH, M, G, XL)"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class TallaCreate(TallaBase):
    """Esquema para crear una nueva talla."""
    pass


class TallaUpdate(BaseModel):
    """Esquema para actualizar una talla (todos los campos son opcionales)."""

    nombre_talla: Optional[str] = Field(None, max_length=10)

    class Config:
        orm_mode = True
        from_attributes = True


class TallaOut(TallaBase):
    """Esquema de salida para una talla, incluyendo su identificador."""

    talla_id: int = Field(..., description="Identificador de la talla")

    class Config:
        orm_mode = True
        from_attributes = True


class TallaList(BaseModel):
    """Esquema para respuestas paginadas de tallas."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[TallaOut]