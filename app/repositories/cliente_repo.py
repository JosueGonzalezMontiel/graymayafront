"""
Funciones de acceso a datos para el modelo `Cliente`.
"""

from typing import List, Optional

from app.models.cliente import Cliente


def create_cliente(data: dict) -> Cliente:
    return Cliente.create(**data)


def get_cliente(cliente_id: int) -> Optional[Cliente]:
    """Obtiene un cliente por su identificador.

    Args:
        cliente_id: valor de la clave primaria ``cliente_id``.

    Returns:
        Instancia de ``Cliente`` o ``None`` si no existe.
    """
    try:
        return Cliente.get(Cliente.cliente_id == cliente_id)
    except Cliente.DoesNotExist:
        return None


def get_cliente_by_usuario(usuario: str) -> Optional[Cliente]:
    try:
        return Cliente.get(Cliente.usuario == usuario)
    except Cliente.DoesNotExist:
        return None


def list_clientes(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "cliente_id",
    desc: bool = False,
) -> List[Cliente]:
    """Lista clientes con búsqueda y ordenamiento.

    - q: texto para buscar en nombre, teléfono, email o usuario
    - limit: máximo de registros
    - offset: desplazamiento
    - order_by: campo de ordenación
    - desc: orden descendente
    """
    query = Cliente.select()
    if q:
        query = query.where(
            (Cliente.nombre.contains(q))
            | (Cliente.telefono.contains(q))
            | (Cliente.email.contains(q))
            | (Cliente.usuario.contains(q))
        )
    total = query.count()
    field = getattr(Cliente, order_by, Cliente.cliente_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_cliente(cliente_id: int, data: dict) -> Optional[Cliente]:
    if Cliente.update(**data).where(Cliente.cliente_id == cliente_id).execute():
        return Cliente.get_by_id(cliente_id)
    return None


def delete_cliente(cliente_id: int) -> bool:
    return bool(Cliente.delete().where(Cliente.cliente_id == cliente_id).execute())