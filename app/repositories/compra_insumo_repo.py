"""
Funciones para registrar compras de insumos. Al registrar una compra se
aumenta el inventario del insumo correspondiente.
"""

from datetime import date
from typing import List, Optional, Tuple

from app.models.compra_insumo import CompraInsumo
from app.repositories.insumo_repo import ajustar_stock_insumo
from app.models.insumo import Insumo


def create_compra_insumo(data: dict) -> Optional[CompraInsumo]:
    """Crea un registro de compra de insumo y actualiza el stock del
    insumo. ``data`` debe contener ``insumo`` (instancia de ``Insumo``),
    ``fecha_compra``, ``cantidad_compra`` y ``costo_total``.
    """
    compra = CompraInsumo.create(**data)
    # Ajustar inventario sumando la cantidad comprada
    ajustar_stock_insumo(compra.insumo.insumo_id, float(compra.cantidad_compra))
    return compra


def get_compra_insumo(compra_id: int) -> Optional[CompraInsumo]:
    try:
        return CompraInsumo.get(CompraInsumo.compra_id == compra_id)
    except CompraInsumo.DoesNotExist:
        return None


def list_compras_insumo(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "compra_id",
    desc: bool = False,
) -> Tuple[List[CompraInsumo], int]:
    """Devuelve una lista de compras de insumo con filtros de búsqueda y
    ordenamiento.

    - q: texto para buscar en el nombre del insumo o en el proveedor
    - limit: máximo de registros
    - offset: desplazamiento para paginación
    - order_by: campo por el cual ordenar (id, fecha_compra, cantidad_compra,
      costo_total, proveedor)
    - desc: True para ordenar de forma descendente

    Returns:
        Tupla (lista de compras, total de registros que cumplen el filtro).
    """
    # Iniciar consulta y unir con Insumo para poder buscar por su nombre
    query = CompraInsumo.select().join(Insumo)
    if q:
        query = query.where(
            (Insumo.nombre_insumo.contains(q))
            | (CompraInsumo.proveedor.contains(q))
        )
    total = query.count()
    # Obtener campo de ordenamiento de CompraInsumo (o del modelo Insumo si así se quiere)
    # Permitir ordenar por cualquier atributo de CompraInsumo definido en el modelo
    field = getattr(CompraInsumo, order_by, CompraInsumo.compra_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total