"""
Funciones para registrar consumos de insumo. Al registrar un uso se
disminuye el inventario del insumo correspondiente.
"""

from datetime import date
from typing import List, Optional, Tuple

from app.models.uso_insumo import UsoInsumo
from app.models.insumo import Insumo
from app.models.producto import Producto
from app.repositories.insumo_repo import ajustar_stock_insumo


def create_uso_insumo(data: dict) -> Optional[UsoInsumo]:
    """Crea un registro de uso de insumo y descuenta la cantidad del
    inventario. ``data`` debe incluir ``insumo``, ``producto`` o ``pedido``,
    ``cantidad_usada`` y ``fecha_uso``.
    """
    uso = UsoInsumo.create(**data)
    ajustar_stock_insumo(uso.insumo.insumo_id, -float(uso.cantidad_usada))
    return uso


def get_uso_insumo(uso_id: int) -> Optional[UsoInsumo]:
    try:
        return UsoInsumo.get(UsoInsumo.uso_id == uso_id)
    except UsoInsumo.DoesNotExist:
        return None


def list_usos_insumo(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "uso_id",
    desc: bool = False,
) -> Tuple[List[UsoInsumo], int]:
    """Devuelve una lista de usos de insumo con búsqueda y ordenamiento.

    - q: texto para buscar en el nombre del insumo, nombre del producto o notas
    - limit: máximo de resultados
    - offset: desplazamiento para paginación
    - order_by: campo de UsoInsumo para ordenar (id, fecha_uso, cantidad_usada)
    - desc: indica si el orden debe ser descendente

    Returns:
        Tupla (lista de usos, total de registros que cumplen el filtro).
    """
    # Unir con Insumo y Producto para búsquedas en sus nombres
    query = (
        UsoInsumo.select()
        .join(Insumo)
        .switch(UsoInsumo)
        .join(Producto, join_type="left outer")
    )
    if q:
        # Filtrar por nombre de insumo, nombre de producto o notas
        query = query.where(
            (Insumo.nombre_insumo.contains(q))
            | (Producto.nombre_producto.contains(q))
            | (UsoInsumo.notas.contains(q))
        )
    total = query.count()
    field = getattr(UsoInsumo, order_by, UsoInsumo.uso_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total