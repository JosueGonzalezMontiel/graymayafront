"""
Rutas para gestionar las categorías de productos. Cada categoría
clasifica a los productos de la tienda (sudaderas, playeras,
accesorios, etc.). Se implementan operaciones CRUD básicas
protegidas por una clave de API.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.categoria_repo import (
    create_categoria,
    delete_categoria,
    get_categoria,
    list_categorias,
    update_categoria,
)
from app.schemas.categoria import (
    CategoriaCreate,
    CategoriaUpdate,
    CategoriaOut,
    CategoriaList,
)


router = APIRouter(
    prefix="/categorias",
    tags=["categorias"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=CategoriaOut, status_code=201)
def create_categoria_endpoint(payload: CategoriaCreate):
    """Crea una nueva categoría."""
    categoria = create_categoria(payload.model_dump())
    return to_dict(categoria)


@router.get("/{categoria_id}", response_model=CategoriaOut)
def get_categoria_endpoint(categoria_id: int):
    """Obtiene una categoría por su ID."""
    categoria = get_categoria(categoria_id)
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return to_dict(categoria)


@router.get("", response_model=CategoriaList)
def list_categorias_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar en nombre o descripción de la categoría",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "categoria_id",
        description="Campo por el cual ordenar (categoria_id, nombre)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista categorías con búsqueda y paginación."""
    categorias, total = list_categorias(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(c) for c in categorias]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{categoria_id}", response_model=CategoriaOut)
def update_categoria_endpoint(categoria_id: int, payload: CategoriaUpdate):
    """Actualiza una categoría."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_categoria(categoria_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Categoría no encontrada o sin cambios")
    return to_dict(updated)


@router.delete("/{categoria_id}", status_code=204)
def delete_categoria_endpoint(categoria_id: int):
    """Elimina una categoría."""
    ok = delete_categoria(categoria_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return None