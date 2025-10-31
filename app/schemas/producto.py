"""
Esquemas Pydantic para productos. Incluyen todos los campos que
representa el modelo Peewee salvo los tiempos de creación y el
identificador en el caso de creación.
"""

from typing import Optional, List

from pydantic import BaseModel, Field


class ProductoBase(BaseModel):
    """Campos base para productos.

    Incluye todos los campos necesarios para crear o actualizar un
    producto. Las claves foráneas se indican mediante sufijo ``_id``.
    """

    nombre_producto: str = Field(
        ..., max_length=100, description="Nombre del producto"
    )
    descripcion: Optional[str] = Field(
        None, description="Descripción del producto"
    )
    precio: float = Field(
        ..., ge=0, description="Precio del producto"
    )
    stock: int = Field(
        0, ge=0, description="Unidades disponibles en inventario"
    )
    url_imagen: Optional[str] = Field(
        None, description="URL o ruta de la imagen del producto"
    )
    categoria_id: int = Field(
        ..., description="Identificador de la categoría"
    )
    talla_id: Optional[int] = Field(
        None, description="Identificador de la talla (si aplica)"
    )
    color: Optional[str] = Field(
        None, max_length=50, description="Color del producto"
    )
    genero: Optional[str] = Field(
        None, max_length=10, description="Género al que va dirigido (Hombre, Mujer, Unisex)"
    )
    tipo_prenda: Optional[str] = Field(
        None, max_length=10, description="Tipo de prenda (BASICA, ESTAMPADA, TIEDYE)"
    )
    patron_id: Optional[int] = Field(
        None, description="Identificador del patrón tie‑dye (si aplica)"
    )
    es_colaboracion: Optional[bool] = Field(
        False, description="Indica si el producto es una colaboración"
    )
    colaborador_id: Optional[int] = Field(
        None, description="Identificador del colaborador (si aplica)"
    )
    detalle_colaboracion: Optional[str] = Field(
        None, description="Detalle de la colaboración"
    )
    sudadera_tipo: Optional[str] = Field(
        None, max_length=20, description="Tipo de sudadera: Cerrada o Con cierre"
    )
    activo: Optional[bool] = Field(
        True, description="Indica si el producto está activo en catálogo"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class ProductoCreate(ProductoBase):
    """Esquema para crear un producto."""
    pass


class ProductoUpdate(BaseModel):
    """Esquema para actualizar un producto (todos los campos son opcionales)."""

    nombre_producto: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = Field(None)
    precio: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    url_imagen: Optional[str] = Field(None)
    categoria_id: Optional[int] = Field(None)
    talla_id: Optional[int] = Field(None)
    color: Optional[str] = Field(None, max_length=50)
    genero: Optional[str] = Field(None, max_length=10)
    tipo_prenda: Optional[str] = Field(None, max_length=10)
    patron_id: Optional[int] = Field(None)
    es_colaboracion: Optional[bool] = Field(None)
    colaborador_id: Optional[int] = Field(None)
    detalle_colaboracion: Optional[str] = Field(None)
    sudadera_tipo: Optional[str] = Field(None, max_length=20)
    activo: Optional[bool] = Field(None)

    class Config:
        orm_mode = True
        from_attributes = True


class ProductoOut(ProductoBase):
    """Esquema de salida para productos.

    Incluye el identificador del producto y puede utilizarse en
    respuestas detalladas o listas. Si se desean incluir objetos
    anidados (categoría, talla, patrón, colaborador) se pueden
    extender mediante otros esquemas.
    """

    producto_id: int = Field(
        ..., description="Identificador del producto"
    )

    class Config:
        orm_mode = True
        from_attributes = True


class ProductoList(BaseModel):
    """Esquema para respuestas paginadas de productos."""

    total: int
    limit: int
    offset: int
    count: int
    items: List[ProductoOut]