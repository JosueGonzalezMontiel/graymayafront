"""
Esquemas Pydantic para insumos (materia prima).
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class InsumoBase(BaseModel):
    """Campos base para insumos (materia prima)."""

    nombre_insumo: str = Field(
        ..., max_length=100, description="Nombre del insumo"
    )
    descripcion: Optional[str] = Field(
        None, max_length=255, description="Descripción del insumo"
    )
    marca: Optional[str] = Field(
        None, max_length=50, description="Marca del insumo"
    )
    color: Optional[str] = Field(
        None, max_length=50, description="Color del insumo"
    )
    unidad_medida: Optional[str] = Field(
        None, max_length=20, description="Unidad de medida"
    )
    stock_insumo: Optional[float] = Field(
        0, description="Cantidad disponible en inventario"
    )
    costo_unitario: Optional[float] = Field(
        None, description="Costo unitario del insumo"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class InsumoCreate(InsumoBase):
    """Esquema para crear un nuevo insumo."""
    pass


class InsumoUpdate(BaseModel):
    """Esquema para actualizar un insumo (campos opcionales)."""

    nombre_insumo: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    marca: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    unidad_medida: Optional[str] = Field(None, max_length=20)
    stock_insumo: Optional[float] = Field(None)
    costo_unitario: Optional[float] = Field(None)

    class Config:
        orm_mode = True
        from_attributes = True


class InsumoOut(InsumoBase):
    """Esquema de salida para insumos."""

    insumo_id: int = Field(..., description="Identificador del insumo")

    class Config:
        orm_mode = True
        from_attributes = True


class InsumoList(BaseModel):
    """Esquema para respuestas paginadas de insumos."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[InsumoOut]