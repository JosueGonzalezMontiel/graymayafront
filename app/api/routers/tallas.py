"""
Rutas para gestionar las tallas disponibles en la tienda. Las
tallas permiten normalizar las opciones como CH, M, G, XL, etc. Las
operaciones CRUD están protegidas por una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.talla_repo import (
    create_talla,
    delete_talla,
    get_talla,
    list_tallas,
    update_talla,
)
from app.schemas.talla import (
    TallaCreate,
    TallaUpdate,
    TallaOut,
    TallaList,
)


router = APIRouter(
    prefix="/tallas",
    tags=["tallas"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=TallaOut, status_code=201)
def create_talla_endpoint(payload: TallaCreate):
    """Crea una nueva talla."""
    talla = create_talla(payload.model_dump())
    return to_dict(talla)


@router.get("/{talla_id}", response_model=TallaOut)
def get_talla_endpoint(talla_id: int):
    """Obtiene una talla por su ID."""
    talla = get_talla(talla_id)
    if not talla:
        raise HTTPException(status_code=404, detail="Talla no encontrada")
    return to_dict(talla)


@router.get("", response_model=TallaList)
def list_tallas_endpoint(
    q: Optional[str] = Query(None, description="Buscar por nombre de talla"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("talla_id", description="Campo por el que ordenar"),
    desc: bool = Query(False, description="Indica si se ordena de forma descendente"),
):
    """Lista tallas con búsqueda y paginación."""
    tallas, total = list_tallas(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(t) for t in tallas]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{talla_id}", response_model=TallaOut)
def update_talla_endpoint(talla_id: int, payload: TallaUpdate):
    """Actualiza una talla."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_talla(talla_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Talla no encontrada o sin cambios")
    return to_dict(updated)


@router.delete("/{talla_id}", status_code=204)
def delete_talla_endpoint(talla_id: int):
    """Elimina una talla."""
    ok = delete_talla(talla_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Talla no encontrada")
    return None