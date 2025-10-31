"""
Rutas para gestionar los productos de la tienda. Los productos
incluyen prendas (sudaderas, playeras) y accesorios (lentes,
joyería), así como productos personalizados o en colaboración. Las
operaciones CRUD están protegidas por una clave de API. La
actualización de inventario al vender se realiza en el módulo de
pedidos.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.producto_repo import (
    create_producto,
    delete_producto,
    get_producto,
    list_productos,
    update_producto,
)
from app.schemas.producto import (
    ProductoCreate,
    ProductoUpdate,
    ProductoOut,
    ProductoList,
)


router = APIRouter(
    prefix="/productos",
    tags=["productos"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=ProductoOut, status_code=201)
def create_producto_endpoint(payload: ProductoCreate):
    """Crea un nuevo producto."""
    producto = create_producto(payload.model_dump())
    return to_dict(producto)


@router.get("/{producto_id}", response_model=ProductoOut)
def get_producto_endpoint(producto_id: int):
    """Obtiene un producto por su ID."""
    producto = get_producto(producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return to_dict(producto)


@router.get("", response_model=ProductoList)
def list_productos_endpoint(
    q: Optional[str] = Query(
        None,
        description="Búsqueda en nombre, tipo_prenda o  talla-id",
    ),
    limit: int = Query(150, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "producto_id",
        description="Campo por el cual ordenar (producto_id, nombre_producto, precio)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista productos con búsqueda y paginación.

    Devuelve un diccionario con claves:
    - total: total de registros que cumplen con el filtro.
    - limit: número máximo solicitado.
    - offset: desplazamiento aplicado.
    - count: número de registros devueltos.
    - items: lista de productos en formato dict.
    """
    productos, total = list_productos(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(p) for p in productos]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{producto_id}", response_model=ProductoOut)
def update_producto_endpoint(producto_id: int, payload: ProductoUpdate):
    """Actualiza un producto."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_producto(producto_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Producto no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{producto_id}", status_code=204)
def delete_producto_endpoint(producto_id: int):
    """Elimina un producto."""
    ok = delete_producto(producto_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return None