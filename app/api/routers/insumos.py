"""
Rutas para gestionar los insumos o materias primas. Permiten
crear, consultar, listar, actualizar y eliminar insumos. El
inventario de insumos se ajusta al registrar compras o consumos en
otros módulos. Todas las operaciones están protegidas por una clave
de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.insumo_repo import (
    create_insumo,
    delete_insumo,
    get_insumo,
    list_insumos,
    update_insumo,
)
from app.schemas.insumo import (
    InsumoCreate,
    InsumoUpdate,
    InsumoOut,
    InsumoList,
)


router = APIRouter(
    prefix="/insumos",
    tags=["insumos"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=InsumoOut, status_code=201)
def create_insumo_endpoint(payload: InsumoCreate):
    """Crea un nuevo insumo."""
    insumo = create_insumo(payload.model_dump())
    return to_dict(insumo)


@router.get("/{insumo_id}", response_model=InsumoOut)
def get_insumo_endpoint(insumo_id: int):
    """Obtiene un insumo por su ID."""
    insumo = get_insumo(insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return to_dict(insumo)


@router.get("", response_model=InsumoList)
def list_insumos_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre, descripción, marca o color",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "insumo_id",
        description="Campo por el cual ordenar (insumo_id, nombre_insumo, marca)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista insumos con búsqueda y paginación"""
    insumos, total = list_insumos(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(i) for i in insumos]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{insumo_id}", response_model=InsumoOut)
def update_insumo_endpoint(insumo_id: int, payload: InsumoUpdate):
    """Actualiza un insumo."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_insumo(insumo_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{insumo_id}", status_code=204)
def delete_insumo_endpoint(insumo_id: int):
    """Elimina un insumo."""
    ok = delete_insumo(insumo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return None