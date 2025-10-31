"""
Esquemas Pydantic para patrones tie‑dye.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class PatronBase(BaseModel):
    """Campos base para patrones tie‑dye."""

    codigo_patron: str = Field(
        ..., max_length=10, description="Código del patrón (clave corta, ej. 'ESP')"
    )
    nombre_patron: str = Field(
        ..., max_length=50, description="Nombre descriptivo del patrón"
    )
    descripcion: Optional[str] = Field(
        None, max_length=255, description="Descripción opcional del patrón"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class PatronCreate(PatronBase):
    """Esquema para crear un patrón."""
    pass


class PatronUpdate(BaseModel):
    """Esquema para actualizar un patrón (todos los campos opcionales)."""

    codigo_patron: Optional[str] = Field(None, max_length=10)
    nombre_patron: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=255)

    class Config:
        orm_mode = True
        from_attributes = True


class PatronOut(PatronBase):
    """Esquema de salida para un patrón."""

    patron_id: int = Field(..., description="Identificador del patrón")

    class Config:
        orm_mode = True
        from_attributes = True


class PatronList(BaseModel):
    """Esquema para respuestas paginadas de patrones."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[PatronOut]