"""
Rutas para gestionar los pedidos (órdenes de compra) de la tienda.
Permiten crear un pedido con sus detalles (items), consultar uno
individualmente, listar pedidos y actualizar su estatus (por
ejemplo, marcar como pagado, entregado o cancelado). Cuando un
pedido se crea se descuenta el inventario de los productos; si se
cancela, se devuelve el stock automáticamente.
"""

from typing import List

from fastapi import APIRouter, HTTPException, Query, Security

from app.api.deps import get_api_key
from app.repositories.pedido_repo import (
    create_pedido,
    get_pedido,
    list_pedidos,
    update_pedido,
    delete_pedido,
    
)
from app.schemas.pedido import (
    PedidoCreate,
    PedidoOut,
)


router = APIRouter(
    prefix="/pedidos",
    tags=["pedidos"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=PedidoOut, status_code=201)
def create_pedido_endpoint(payload: PedidoCreate):
    """Crea un pedido nuevo, con sus detalles, y actualiza el inventario."""
    pedido = create_pedido(
        cliente_id=payload.cliente_id,
        metodo_pago=payload.metodo_pago,
        items=[item.model_dump() for item in payload.items],
        direccion_entrega=payload.direccion_entrega,
        instrucciones_entrega=payload.instrucciones_entrega,
    )
    if not pedido:
        # Falló la creación por falta de stock o cliente inexistente
        raise HTTPException(
            status_code=400,
            detail="No se pudo crear el pedido. Verifique el cliente y el inventario disponible.",
        )
    return pedido  # Pydantic convierte automáticamente gracias a orm_mode


@router.get("/{pedido_id}", response_model=PedidoOut)
def get_pedido_endpoint(pedido_id: int):
    """Obtiene un pedido por su ID."""
    pedido = get_pedido(pedido_id) 
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


@router.get("", response_model=List[PedidoOut])
def list_pedidos_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=2000),
):
    """Lista pedidos con paginación."""
    pedidos = list_pedidos(skip=skip, limit=limit)
    return pedidos


@router.put("/{pedido_id}", response_model=PedidoOut)
def update_pedido_endpoint(pedido_id: int, payload: PedidoCreate):
    """Actualiza TODO el pedido usando el mismo JSON que el POST/GET.

    Reemplaza detalles, cliente, método de pago y direcciones.
    Si falta stock para la nueva composición, no aplica los cambios.
    """
    existing = get_pedido(pedido_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    updated = update_pedido(
        pedido_id=pedido_id,
        cliente_id=payload.cliente_id,
        metodo_pago=payload.metodo_pago,
        items=[item.model_dump() for item in payload.items],
        direccion_entrega=payload.direccion_entrega,
        instrucciones_entrega=payload.instrucciones_entrega,
    )
    if not updated:
        # Puede fallar por cliente inexistente o falta de stock
        raise HTTPException(
            status_code=400,
            detail="No se pudo actualizar el pedido. Verifique cliente y stock disponible.",
        )
    return updated

@router.delete("/{pedido_id}", status_code=204)
def delete_pedido_endpoint(pedido_id: int):
    """Elimina un pedido y devuelve el stock de sus productos."""
    deleted = delete_pedido(pedido_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return None