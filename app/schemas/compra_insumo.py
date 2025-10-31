"""
Esquemas Pydantic para las compras de insumos (entradas de materia
prima). Estos esquemas definen los campos necesarios para crear un
registro de compra y para devolver información al cliente de la
API. Los campos se normalizan utilizando claves foráneas al
insumo correspondiente.
"""

from datetime import date
from typing import Optional, List

from pydantic import BaseModel, Field


class CompraInsumoBase(BaseModel):
    """Campos base para las compras de insumos."""

    insumo_id: int = Field(
        ..., description="Identificador del insumo comprado"
    )
    fecha_compra: date = Field(
        ..., description="Fecha de la compra (YYYY-MM-DD)"
    )
    cantidad_compra: float = Field(
        ..., gt=0, description="Cantidad adquirida del insumo"
    )
    costo_total: float = Field(
        ..., gt=0, description="Costo total de la compra"
    )
    proveedor: Optional[str] = Field(
        None, max_length=100, description="Proveedor del insumo"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class CompraInsumoCreate(CompraInsumoBase):
    """Esquema para crear una compra de insumo."""
    pass


class CompraInsumoOut(CompraInsumoBase):
    """Esquema de salida para una compra de insumo."""

    compra_id: int = Field(..., description="Identificador de la compra")

    class Config:
        orm_mode = True
        from_attributes = True


class CompraInsumoList(BaseModel):
    """Esquema para respuestas paginadas de compras de insumo."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[CompraInsumoOut]