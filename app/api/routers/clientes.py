"""
Rutas para gestionar los clientes de la tienda. Incluye
operaciones para crear, consultar, listar, actualizar y eliminar
clientes. Por razones de seguridad, la contraseña no se expone en
las respuestas. Todas las rutas están protegidas por una clave de
API para restringir el acceso a usuarios administradores.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.cliente_repo import (
    create_cliente,
    delete_cliente,
    get_cliente,
    list_clientes,
    update_cliente,
)
from app.schemas.cliente import (
    ClienteCreate,
    ClienteUpdate,
    ClienteOut,
    ClienteList,
)


router = APIRouter(
    prefix="/clientes",
    tags=["clientes"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=ClienteOut, status_code=201)
def create_cliente_endpoint(payload: ClienteCreate):
    """Crea un nuevo cliente."""
    cliente = create_cliente(payload.model_dump())
    return to_dict(cliente)


@router.get("/{cliente_id}", response_model=ClienteOut)
def get_cliente_endpoint(cliente_id: int):
    """Obtiene un cliente por su ID."""
    cliente = get_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return to_dict(cliente)


@router.get("", response_model=ClienteList)
def list_clientes_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre, teléfono, email o usuario",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "cliente_id",
        description="Campo por el cual ordenar (cliente_id, nombre, usuario)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista clientes con búsqueda y paginación."""
    clientes, total = list_clientes(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(c) for c in clientes]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{cliente_id}", response_model=ClienteOut)
def update_cliente_endpoint(cliente_id: int, payload: ClienteUpdate):
    """Actualiza los datos de un cliente."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_cliente(cliente_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Cliente no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{cliente_id}", status_code=204)
def delete_cliente_endpoint(cliente_id: int):
    """Elimina un cliente."""
    ok = delete_cliente(cliente_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return None