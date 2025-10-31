"""
Esquemas Pydantic para categorías. Se definen modelos para peticiones
de creación, actualizaciones y respuestas.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class CategoriaBase(BaseModel):
    """Campos base para categorías.

    Incluye los campos que se requieren al crear o actualizar una
    categoría. La clave primaria (``categoria_id``) se define en
    `CategoriaOut`.
    """

    nombre: str = Field(..., max_length=50, description="Nombre de la categoría")
    descripcion: Optional[str] = Field(
        None, max_length=255, description="Descripción de la categoría"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class CategoriaCreate(CategoriaBase):
    """Esquema para crear una nueva categoría."""
    pass


class CategoriaUpdate(BaseModel):
    """Esquema para actualizar una categoría."""

    nombre: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=255)

    class Config:
        orm_mode = True
        from_attributes = True


class CategoriaOut(CategoriaBase):
    """Esquema de salida para una categoría.

    Incluye el identificador de la categoría.
    """

    categoria_id: int = Field(..., description="Identificador de la categoría")

    class Config:
        orm_mode = True
        from_attributes = True


class CategoriaList(BaseModel):
    """Esquema para respuestas paginadas de categorías."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[CategoriaOut]