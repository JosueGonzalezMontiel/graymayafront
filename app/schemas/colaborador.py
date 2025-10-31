"""
Esquemas Pydantic para colaboradores/proveedores.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class ColaboradorBase(BaseModel):
    """Campos base para colaboradores o proveedores."""

    nombre: str = Field(..., max_length=100, description="Nombre del colaborador o proveedor")
    contacto: Optional[str] = Field(
        None, max_length=100, description="Información de contacto del colaborador"
    )
    detalle_acuerdo: Optional[str] = Field(
        None, max_length=255, description="Detalle del acuerdo o colaboración"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class ColaboradorCreate(ColaboradorBase):
    """Esquema para crear un colaborador."""
    pass


class ColaboradorUpdate(BaseModel):
    """Esquema para actualizar un colaborador (campos opcionales)."""

    nombre: Optional[str] = Field(None, max_length=100)
    contacto: Optional[str] = Field(None, max_length=100)
    detalle_acuerdo: Optional[str] = Field(None, max_length=255)

    class Config:
        orm_mode = True
        from_attributes = True


class ColaboradorOut(ColaboradorBase):
    """Esquema de salida para un colaborador."""

    colaborador_id: int = Field(..., description="Identificador del colaborador")

    class Config:
        orm_mode = True
        from_attributes = True


class ColaboradorList(BaseModel):
    """Esquema para respuestas paginadas de colaboradores."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[ColaboradorOut]