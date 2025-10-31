"""
Funciones de acceso a datos para el modelo `Patron`.
"""

from typing import List, Optional

from app.models.patron import Patron


def create_patron(data: dict) -> Patron:
    return Patron.create(**data)


def get_patron(patron_id: int) -> Optional[Patron]:
    """Obtiene un patrón por su identificador.

    Args:
        patron_id: valor de la clave primaria ``patron_id``.

    Returns:
        Instancia de ``Patron`` o ``None`` si no existe.
    """
    try:
        return Patron.get(Patron.patron_id == patron_id)
    except Patron.DoesNotExist:
        return None


def list_patrones(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "patron_id",
    desc: bool = False,
) -> List[Patron]:
    """Lista patrones con búsqueda y ordenamiento."""
    query = Patron.select()
    if q:
        query = query.where(
            (Patron.codigo_patron.contains(q)) | (Patron.nombre_patron.contains(q))
        )
    total = query.count()
    field = getattr(Patron, order_by, Patron.patron_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_patron(patron_id: int, data: dict) -> Optional[Patron]:
    if Patron.update(**data).where(Patron.patron_id == patron_id).execute():
        return Patron.get_by_id(patron_id)
    return None


def delete_patron(patron_id: int) -> bool:
    return bool(Patron.delete().where(Patron.patron_id == patron_id).execute())