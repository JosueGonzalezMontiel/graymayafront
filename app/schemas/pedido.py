"""
Esquemas Pydantic para pedidos y detalles de pedido. Se define un
modelo para crear pedidos que contiene la lista de items a comprar.
"""

from typing import List, Optional

from pydantic import BaseModel, Field
from datetime import datetime


class PedidoItem(BaseModel):
    """Representa un ítem en el carrito o pedido."""

    producto_id: int = Field(
        ..., description="Identificador del producto que se va a comprar"
    )
    cantidad: int = Field(
        ..., gt=0, description="Cantidad solicitada del producto"
    )
    notas_personalizacion: Optional[str] = Field(
        None, description="Notas de personalización para este ítem"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class PedidoCreate(BaseModel):
    """Esquema para crear un nuevo pedido."""

    cliente_id: int = Field(..., description="Identificador del cliente")
    metodo_pago: str = Field(
        ..., description="Método de pago (EFECTIVO o DEPOSITO)"
    )
    items: List[PedidoItem] = Field(
        ..., description="Lista de productos a comprar"
    )
    direccion_entrega: Optional[str] = Field(
        None, description="Dirección de entrega si aplica"
    )
    instrucciones_entrega: Optional[str] = Field(
        None, description="Instrucciones adicionales de entrega"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class DetallePedidoOut(BaseModel):
    """Esquema de salida para un detalle de pedido."""

    detalle_id: int = Field(..., description="Identificador del detalle")
    producto_id: Optional[int] = Field(
        None, description="Identificador del producto (puede ser None si es personalizado)"
    )
    cantidad: int
    precio_unitario: float
    colaborador_id: Optional[int] = Field(
        None, description="Identificador del colaborador (si aplica)"
    )
    comision_pagada: bool
    notas_personalizacion: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True


class PedidoOut(BaseModel):
    """Esquema de salida para un pedido."""

    pedido_id: int = Field(..., description="Identificador del pedido")
    cliente_id: int
    fecha_pedido: datetime
    metodo_pago: str
    estatus: str
    monto_total: float
    direccion_entrega: Optional[str] = None
    instrucciones_entrega: Optional[str] = None
    detalles: List[DetallePedidoOut]

    class Config:
        orm_mode = True
        from_attributes = True


class DetallePedidoUpdate(BaseModel):
    """Esquema para actualizar un detalle de pedido."""

    detalle_id: Optional[int]
    producto_id: int
    cantidad: int
    precio_unitario: float
    colaborador_id: Optional[int]
    comision_pagada: Optional[bool]
    notas_personalizacion: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True


class PedidoUpdate(BaseModel):
    """Esquema para actualizar un pedido."""

    pedido_id: Optional[int]
    cliente_id: int
    fecha_pedido: Optional[datetime]
    metodo_pago: str
    estatus: str
    monto_total: Optional[float]
    direccion_entrega: Optional[str]
    instrucciones_entrega: Optional[str]
    detalles: List[DetallePedidoUpdate]

    class Config:
        orm_mode = True
        from_attributes = True