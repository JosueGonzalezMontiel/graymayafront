"""
Funciones de acceso a datos para el modelo `Colaborador`.
"""

from typing import List, Optional

from app.models.colaborador import Colaborador


def create_colaborador(data: dict) -> Colaborador:
    return Colaborador.create(**data)


def get_colaborador(colaborador_id: int) -> Optional[Colaborador]:
    """Obtiene un colaborador por su identificador.

    Args:
        colaborador_id: valor de la clave primaria ``colaborador_id``.

    Returns:
        Instancia de ``Colaborador`` o ``None`` si no existe.
    """
    try:
        return Colaborador.get(Colaborador.colaborador_id == colaborador_id)
    except Colaborador.DoesNotExist:
        return None


def list_colaboradores(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "colaborador_id",
    desc: bool = False,
) -> List[Colaborador]:
    """Lista colaboradores con búsqueda y ordenamiento.

    - q: texto para buscar en nombre o detalle_acuerdo
    - limit: máximo de registros
    - offset: desplazamiento
    - order_by: campo de ordenación
    - desc: orden descendente
    """
    query = Colaborador.select()
    if q:
        query = query.where(
            (Colaborador.nombre.contains(q)) | (Colaborador.contacto.contains(q))
        )
    total = query.count()
    field = getattr(Colaborador, order_by, Colaborador.colaborador_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_colaborador(colaborador_id: int, data: dict) -> Optional[Colaborador]:
    if Colaborador.update(**data).where(Colaborador.colaborador_id == colaborador_id).execute():
        return Colaborador.get_by_id(colaborador_id)
    return None


def delete_colaborador(colaborador_id: int) -> bool:
    return bool(Colaborador.delete().where(Colaborador.colaborador_id == colaborador_id).execute())