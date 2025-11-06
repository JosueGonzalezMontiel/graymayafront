"""
Rutas para gestionar los pedidos (órdenes de compra) de la tienda.
Permiten crear un pedido con sus detalles (items), consultar uno
individualmente, listar pedidos y actualizar su estatus (por
ejemplo, marcar como pagado, entregado o cancelado). Cuando un
pedido se crea se descuenta el inventario de los productos; si se
cancela, se devuelve el stock automáticamente.
"""

from datetime import date
from typing import List, Union

from fastapi import APIRouter, HTTPException, Query, Security, Response, Request
from fastapi.responses import StreamingResponse

from app.api.deps import get_api_key
from app.repositories.pedido_repo import (
    create_pedido,
    get_pedido,
    list_pedidos,
    update_pedido,
    delete_pedido,
    count_pedidos,
)
from app.schemas.pedido import (
    PedidoCreate,
    PedidoOut,
    PedidoUpdate,  # usamos su estructura con "detalles"
)


router = APIRouter(
    prefix="/pedidos",
    tags=["pedidos"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=PedidoOut, status_code=201)
def create_pedido_endpoint(payload: Union[PedidoCreate, PedidoUpdate]):
    """Crea un pedido. Acepta cuerpo con 'items' (PedidoCreate) o con 'detalles' (PedidoUpdate)."""
    if isinstance(payload, PedidoCreate):
        items = [item.model_dump() for item in payload.items]
        direccion_entrega = payload.direccion_entrega
        instrucciones_entrega = payload.instrucciones_entrega
        cliente_id = payload.cliente_id
        metodo_pago = payload.metodo_pago
    else:
        # Normaliza desde 'detalles' -> 'items'
        items = [
            {
                "producto_id": d.producto_id,
                "cantidad": d.cantidad,
                "notas_personalizacion": d.notas_personalizacion,
            }
            for d in payload.detalles
        ]
        direccion_entrega = payload.direccion_entrega
        instrucciones_entrega = payload.instrucciones_entrega
        cliente_id = payload.cliente_id
        metodo_pago = payload.metodo_pago

    pedido = create_pedido(
        cliente_id=cliente_id,
        metodo_pago=metodo_pago,
        items=items,
        direccion_entrega=direccion_entrega,
        instrucciones_entrega=instrucciones_entrega,
    )
    if not pedido:
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
    request: Request,
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=2000),
    cliente_id: int | None = Query(None),
    estatus: str | None = Query(None),
    desde: date | None = Query(None, description="YYYY-MM-DD"),
    hasta: date | None = Query(None, description="YYYY-MM-DD"),
):
    """Lista pedidos con paginación y filtros."""
    pedidos = list_pedidos(skip=skip, limit=limit, cliente_id=cliente_id, estatus=estatus, desde=desde, hasta=hasta)
    total = count_pedidos(cliente_id=cliente_id, estatus=estatus, desde=desde, hasta=hasta)

    response.headers["X-Total-Count"] = str(total)
    links = []
    if skip + limit < total:
        next_url = str(request.url.include_query_params(skip=skip + limit, limit=limit))
        links.append(f'<{next_url}>; rel="next"')
    if skip > 0:
        prev_skip = max(skip - limit, 0)
        prev_url = str(request.url.include_query_params(skip=prev_skip, limit=limit))
        links.append(f'<{prev_url}>; rel="prev"')
    if links:
        response.headers["Link"] = ", ".join(links)

    return pedidos


@router.get("/export", response_class=StreamingResponse)
def export_pedidos_endpoint(
    cliente_id: int | None = Query(None),
    estatus: str | None = Query(None),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
):
    """Exporta pedidos filtrados como CSV."""
    import csv, io

    def stream():
        header = ["pedido_id", "cliente_id", "estatus", "metodo_pago", "monto_total", "direccion_entrega", "instrucciones_entrega"]
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(header)
        yield buf.getvalue(); buf.seek(0); buf.truncate(0)

        page, skip = 1000, 0
        while True:
            batch = list_pedidos(skip=skip, limit=page, cliente_id=cliente_id, estatus=estatus, desde=desde, hasta=hasta)
            if not batch:
                break
            for p in batch:
                writer.writerow([
                    getattr(p, "pedido_id", None),
                    getattr(p, "cliente_id", None),
                    getattr(p, "estatus", None),
                    getattr(p, "metodo_pago", None),
                    getattr(p, "monto_total", None),
                    getattr(p, "direccion_entrega", None),
                    getattr(p, "instrucciones_entrega", None),
                ])
            yield buf.getvalue(); buf.seek(0); buf.truncate(0)
            skip += page

    headers = {"Content-Disposition": 'attachment; filename="pedidos.csv"'}
    return StreamingResponse(stream(), media_type="text/csv", headers=headers)


@router.put("/{pedido_id}", response_model=PedidoOut)
def update_pedido_endpoint(pedido_id: int, payload: PedidoUpdate):
    """Actualiza TODO el pedido usando el JSON completo (PedidoOut)."""
    existing = get_pedido(pedido_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    updated = update_pedido(
        pedido_id=pedido_id,
        cliente_id=payload.cliente_id,
        metodo_pago=payload.metodo_pago,
        estatus=payload.estatus,
        monto_total=payload.monto_total,
        direccion_entrega=payload.direccion_entrega,
        instrucciones_entrega=payload.instrucciones_entrega,
        detalles=[detalle.model_dump() for detalle in payload.detalles],
    )
    if not updated:
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