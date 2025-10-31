"""
Rutas para gestionar los patrones tie‑dye. Estos patrones son
utilizados en la personalización de prendas y cada uno cuenta con
un código y un nombre descriptivo. Las operaciones están protegidas
por una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.patron_repo import (
    create_patron,
    delete_patron,
    get_patron,
    list_patrones,
    update_patron,
)
from app.schemas.patron import (
    PatronCreate,
    PatronUpdate,
    PatronOut,
    PatronList,
)


router = APIRouter(
    prefix="/patrones",
    tags=["patrones"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=PatronOut, status_code=201)
def create_patron_endpoint(payload: PatronCreate):
    """Crea un nuevo patrón tie‑dye."""
    patron = create_patron(payload.model_dump())
    return to_dict(patron)


@router.get("/{patron_id}", response_model=PatronOut)
def get_patron_endpoint(patron_id: int):
    """Obtiene un patrón por su ID."""
    patron = get_patron(patron_id)
    if not patron:
        raise HTTPException(status_code=404, detail="Patrón no encontrado")
    return to_dict(patron)


@router.get("", response_model=PatronList)
def list_patrones_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por código o nombre del patrón",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "patron_id",
        description="Campo por el cual ordenar (patron_id, codigo_patron, nombre_patron)",
    ),
    desc: bool = Query(
        False,
        description="Orden descendente si True",
    ),
):
    """Lista patrones con búsqueda y paginación."""
    patrones, total = list_patrones(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(p) for p in patrones]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{patron_id}", response_model=PatronOut)
def update_patron_endpoint(patron_id: int, payload: PatronUpdate):
    """Actualiza un patrón."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_patron(patron_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Patrón no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{patron_id}", status_code=204)
def delete_patron_endpoint(patron_id: int):
    """Elimina un patrón."""
    ok = delete_patron(patron_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Patrón no encontrado")
    return None