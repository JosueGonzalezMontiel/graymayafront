"""
Funciones de acceso a datos para el modelo `Insumo` y utilidades
relacionadas con compras y consumos de materia prima.
"""

from typing import List, Optional

from app.models.insumo import Insumo


def create_insumo(data: dict) -> Insumo:
    return Insumo.create(**data)


def get_insumo(insumo_id: int) -> Optional[Insumo]:
    try:
        return Insumo.get(Insumo.insumo_id == insumo_id)
    except Insumo.DoesNotExist:
        return None


def list_insumos(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "insumo_id",
    desc: bool = False,
) -> List[Insumo]:
    """Lista insumos con búsqueda y ordenamiento.

    - q: texto para buscar en nombre_insumo, descripcion, marca o color
    - limit: máximo de resultados
    - offset: número de elementos a saltar
    - order_by: campo por el que ordenar
    - desc: si se ordena de forma descendente
    """
    query = Insumo.select()
    if q:
        query = query.where(
            (Insumo.nombre_insumo.contains(q))
            | (Insumo.descripcion.contains(q))
            | (Insumo.marca.contains(q))
            | (Insumo.color.contains(q))
        )
    total = query.count()
    field = getattr(Insumo, order_by, Insumo.insumo_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_insumo(insumo_id: int, data: dict) -> Optional[Insumo]:
    if Insumo.update(**data).where(Insumo.insumo_id == insumo_id).execute():
        return Insumo.get_by_id(insumo_id)
    return None


def delete_insumo(insumo_id: int) -> bool:
    return bool(Insumo.delete().where(Insumo.insumo_id == insumo_id).execute())


def ajustar_stock_insumo(insumo_id: int, cantidad: float) -> bool:
    """Ajusta el inventario de un insumo. La cantidad puede ser positiva
    (entrada) o negativa (salida). Si el resultado es negativo no se
    realiza el ajuste.
    """
    insumo = get_insumo(insumo_id)
    if not insumo:
        return False
    nuevo_stock = float(insumo.stock_insumo) + float(cantidad)
    if nuevo_stock < 0:
        return False
    insumo.stock_insumo = nuevo_stock
    insumo.save()
    return True