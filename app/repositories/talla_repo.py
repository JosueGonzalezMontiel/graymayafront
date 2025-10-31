"""
Funciones de acceso a datos para el modelo `Talla`.
"""

from typing import List, Optional

from app.models.talla import Talla


def create_talla(data: dict) -> Talla:
    return Talla.create(**data)


def get_talla(talla_id: int) -> Optional[Talla]:
    """Obtiene una talla por su identificador.

    Args:
        talla_id: valor de la clave primaria ``talla_id``.

    Returns:
        Instancia de ``Talla`` o ``None`` si no existe.
    """
    try:
        return Talla.get(Talla.talla_id == talla_id)
    except Talla.DoesNotExist:
        return None


def list_tallas(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "talla_id",
    desc: bool = False,
) -> List[Talla]:
    """Lista tallas con búsqueda y ordenamiento.

    - q: texto para buscar en nombre_talla
    - limit: máximo de resultados
    - offset: desplazamiento
    - order_by: campo por el cual ordenar
    - desc: True para ordenar descendente
    """
    query = Talla.select()
    if q:
        query = query.where(Talla.nombre_talla.contains(q))
    total = query.count()
    field = getattr(Talla, order_by, Talla.talla_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_talla(talla_id: int, data: dict) -> Optional[Talla]:
    if Talla.update(**data).where(Talla.talla_id == talla_id).execute():
        return Talla.get_by_id(talla_id)
    return None


def delete_talla(talla_id: int) -> bool:
    return bool(Talla.delete().where(Talla.talla_id == talla_id).execute())