"""
Rutas para registrar el consumo de insumos en la producción o
personalización. Al crear un uso se descuenta el inventario del
insumo. También se pueden consultar y listar usos. Está protegido
por una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.models.insumo import Insumo
from app.models.producto import Producto
from app.models.pedido import Pedido
from app.repositories.uso_insumo_repo import (
    create_uso_insumo,
    get_uso_insumo,
    list_usos_insumo,
)
from app.schemas.uso_insumo import (
    UsoInsumoCreate,
    UsoInsumoOut,
    UsoInsumoList,
)


router = APIRouter(
    prefix="/usos-insumo",
    tags=["usos_insumo"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=UsoInsumoOut, status_code=201)
def create_uso_insumo_endpoint(payload: UsoInsumoCreate):
    """Registra el consumo de un insumo y descuenta el inventario."""
    # Verificar insumo
    try:
        insumo = Insumo.get_by_id(payload.insumo_id)
    except Insumo.DoesNotExist:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    producto = None
    pedido = None
    # Producto es opcional
    if payload.producto_id is not None:
        try:
            producto = Producto.get_by_id(payload.producto_id)
        except Producto.DoesNotExist:
            raise HTTPException(status_code=404, detail="Producto asociado no encontrado")
    # Pedido es opcional
    if payload.pedido_id is not None:
        try:
            pedido = Pedido.get_by_id(payload.pedido_id)
        except Pedido.DoesNotExist:
            raise HTTPException(status_code=404, detail="Pedido asociado no encontrado")
    data = {
        "insumo": insumo,
        "producto": producto,
        "pedido": pedido,
        "cantidad_usada": payload.cantidad_usada,
        "fecha_uso": payload.fecha_uso,
        "notas": payload.notas,
    }
    uso = create_uso_insumo(data)
    return to_dict(uso)


@router.get("/{uso_id}", response_model=UsoInsumoOut)
def get_uso_insumo_endpoint(uso_id: int):
    """Obtiene un uso de insumo por su ID."""
    uso = get_uso_insumo(uso_id)
    if not uso:
        raise HTTPException(status_code=404, detail="Uso de insumo no encontrado")
    return to_dict(uso)


@router.get("", response_model=UsoInsumoList)
def list_usos_insumo_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre del insumo, nombre del producto o notas",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "uso_id",
        description="Campo por el cual ordenar (uso_id, fecha_uso, cantidad_usada)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden es descendente",
    ),
):
    """Lista usos de insumo con búsqueda y paginación.

    Devuelve un diccionario con claves:
    - total: total de registros que cumplen con el filtro
    - limit: número máximo solicitado
    - offset: desplazamiento aplicado
    - count: número de registros devueltos
    - items: lista de usos de insumo
    """
    usos, total = list_usos_insumo(
        q=q, limit=limit, offset=offset, order_by=order_by, desc=desc
    )
    items = [to_dict(u) for u in usos]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }