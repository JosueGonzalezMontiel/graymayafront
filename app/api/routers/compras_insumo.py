"""
Rutas para registrar las compras de insumos. Al crear una compra se
aumenta automáticamente el inventario del insumo. También se pueden
consultar y listar compras. Se protege con una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.models.insumo import Insumo
from app.repositories.compra_insumo_repo import (
    create_compra_insumo,
    get_compra_insumo,
    list_compras_insumo,
)
from app.schemas.compra_insumo import (
    CompraInsumoCreate,
    CompraInsumoOut,
    CompraInsumoList,
)


router = APIRouter(
    prefix="/compras-insumo",
    tags=["compras_insumo"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=CompraInsumoOut, status_code=201)
def create_compra_insumo_endpoint(payload: CompraInsumoCreate):
    """Registra la compra de un insumo y actualiza el inventario."""
    try:
        insumo = Insumo.get_by_id(payload.insumo_id)
    except Insumo.DoesNotExist:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    data = {
        "insumo": insumo,
        "fecha_compra": payload.fecha_compra,
        "cantidad_compra": payload.cantidad_compra,
        "costo_total": payload.costo_total,
        "proveedor": payload.proveedor,
    }
    compra = create_compra_insumo(data)
    return to_dict(compra)


@router.get("/{compra_id}", response_model=CompraInsumoOut)
def get_compra_insumo_endpoint(compra_id: int):
    """Obtiene una compra de insumo por su ID."""
    compra = get_compra_insumo(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra de insumo no encontrada")
    return to_dict(compra)


@router.get("", response_model=CompraInsumoList)
def list_compras_insumo_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre del insumo o proveedor",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "compra_id",
        description="Campo por el cual ordenar (compra_id, fecha_compra, cantidad_compra, costo_total, proveedor)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista compras de insumo con búsqueda y paginación.

    Devuelve un diccionario con claves:
    - total: total de registros que cumplen con el filtro
    - limit: número máximo solicitado
    - offset: desplazamiento aplicado
    - count: número de registros devueltos
    - items: lista de compras de insumo
    """
    compras, total = list_compras_insumo(
        q=q, limit=limit, offset=offset, order_by=order_by, desc=desc
    )
    items = [to_dict(c) for c in compras]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }