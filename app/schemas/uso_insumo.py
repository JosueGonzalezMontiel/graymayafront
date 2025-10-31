"""
Esquemas Pydantic para el registro de uso de insumos (consumos de
materia prima). Estos modelos permiten registrar cuándo y cuánto
material se utiliza al fabricar productos personalizados o al
surtir un pedido. Las relaciones con producto y pedido son
opcionales para permitir usos generales o globales.
"""

from datetime import date
from typing import Optional, List

from pydantic import BaseModel, Field


class UsoInsumoBase(BaseModel):
    """Campos base para el uso de insumos (consumos de materia prima)."""

    insumo_id: int = Field(
        ..., description="Identificador del insumo utilizado"
    )
    producto_id: Optional[int] = Field(
        None, description="Identificador del producto asociado (si aplica)"
    )
    pedido_id: Optional[int] = Field(
        None, description="Identificador del pedido asociado (si aplica)"
    )
    cantidad_usada: float = Field(
        ..., gt=0, description="Cantidad del insumo utilizada"
    )
    fecha_uso: date = Field(
        ..., description="Fecha en que se utilizó el insumo"
    )
    notas: Optional[str] = Field(
        None, description="Notas adicionales sobre el uso"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class UsoInsumoCreate(UsoInsumoBase):
    """Esquema para crear un registro de uso de insumo."""
    pass


class UsoInsumoOut(UsoInsumoBase):
    """Esquema de salida para un registro de uso de insumo."""

    uso_id: int = Field(
        ..., description="Identificador del consumo de insumo"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class UsoInsumoList(BaseModel):
    """Esquema para respuestas paginadas de usos de insumo."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[UsoInsumoOut]