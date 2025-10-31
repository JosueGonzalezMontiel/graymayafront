"""
Rutas para gestionar los colaboradores o proveedores externos. Estos
colaboradores pueden proveer productos o diseños, y se requieren
para registrar comisiones y colaboraciones. Las operaciones están
protegidas por una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.colaborador_repo import (
    create_colaborador,
    delete_colaborador,
    get_colaborador,
    list_colaboradores,
    update_colaborador,
)
from app.schemas.colaborador import (
    ColaboradorCreate,
    ColaboradorUpdate,
    ColaboradorOut,
    ColaboradorList,
)


router = APIRouter(
    prefix="/colaboradores",
    tags=["colaboradores"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=ColaboradorOut, status_code=201)
def create_colaborador_endpoint(payload: ColaboradorCreate):
    """Crea un colaborador o proveedor externo."""
    colaborador = create_colaborador(payload.model_dump())
    return to_dict(colaborador)


@router.get("/{colaborador_id}", response_model=ColaboradorOut)
def get_colaborador_endpoint(colaborador_id: int):
    """Obtiene un colaborador por su ID."""
    colaborador = get_colaborador(colaborador_id)
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    return to_dict(colaborador)


@router.get("", response_model=ColaboradorList)
def list_colaboradores_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre o detalle del acuerdo",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "colaborador_id",
        description="Campo por el cual ordenar (colaborador_id, nombre)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden es descendente",
    ),
):
    """Lista colaboradores con búsqueda y paginación."""
    colaboradores, total = list_colaboradores(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(c) for c in colaboradores]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{colaborador_id}", response_model=ColaboradorOut)
def update_colaborador_endpoint(colaborador_id: int, payload: ColaboradorUpdate):
    """Actualiza un colaborador."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_colaborador(colaborador_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{colaborador_id}", status_code=204)
def delete_colaborador_endpoint(colaborador_id: int):
    """Elimina un colaborador."""
    ok = delete_colaborador(colaborador_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    return None