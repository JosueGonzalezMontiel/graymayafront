"""
Funciones de acceso a datos para `Pedido` y `DetallePedido`. Incluye
lógica para crear un pedido con sus detalles y ajustar el stock de los
productos involucrados.
"""

from typing import List, Optional, Sequence

from peewee import DoesNotExist

from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.repositories.producto_repo import ajustar_stock, get_producto


def create_pedido(
    cliente_id: int,
    metodo_pago: str,
    items: Sequence[dict],
    direccion_entrega: str | None = None,
    instrucciones_entrega: str | None = None,
) -> Optional[Pedido]:
    """Crea un pedido con sus detalles y actualiza el inventario de
    productos. `items` debe ser una lista de diccionarios con
    `producto_id`, `cantidad` y opcionalmente `notas_personalizacion`.

    Devuelve la instancia de `Pedido` creada o `None` si falla (por
    ejemplo si no hay suficiente stock).
    """
    try:
        cliente = Cliente.get_by_id(cliente_id)
    except DoesNotExist:
        return None
    # Calcular monto total y verificar inventario
    monto_total = 0
    detalles = []
    for item in items:
        producto = get_producto(item["producto_id"])
        if not producto:
            return None
        cantidad = item.get("cantidad", 1)
        # Verificar stock disponible
        if producto.stock < cantidad:
            return None
        subtotal = float(producto.precio) * cantidad
        monto_total += subtotal
        detalles.append(
            {
                "producto": producto,
                "cantidad": cantidad,
                "precio_unitario": producto.precio,
                "colaborador": producto.colaborador,
                "notas_personalizacion": item.get("notas_personalizacion"),
            }
        )
    # Crear pedido
    pedido = Pedido.create(
        cliente=cliente,
        metodo_pago=metodo_pago,
        estatus="POR PAGAR",
        monto_total=monto_total,
        direccion_entrega=direccion_entrega,
        instrucciones_entrega=instrucciones_entrega,
    )
    # Crear detalles y ajustar inventario
    for d in detalles:
        DetallePedido.create(
            pedido=pedido,
            producto=d["producto"],
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"],
            colaborador=d["colaborador"],
            notas_personalizacion=d.get("notas_personalizacion"),
        )
        # Restar del stock
        ajustar_stock(d["producto"].producto_id, -d["cantidad"])
    return pedido


def get_pedido(pedido_id: int) -> Optional[Pedido]:
    try:
        return Pedido.get(Pedido.pedido_id == pedido_id)
    except Pedido.DoesNotExist:
        return None


def list_pedidos(skip: int = 0, limit: int = 50) -> List[Pedido]:
    return list(Pedido.select().offset(skip).limit(limit))




def update_pedido(
    pedido_id: int,
    cliente_id: int,
    metodo_pago: str,
    items: Sequence[dict],
    direccion_entrega: str | None = None,
    instrucciones_entrega: str | None = None,
) -> Optional[Pedido]:
    """Reemplaza completamente un pedido (cliente, metodo_pago, detalles, direccion).
    Devuelve el pedido actualizado o None si falla (cliente inexistente o falta stock).
    """
    pedido = get_pedido(pedido_id)
    if not pedido:
        return None

    # Validar cliente
    try:
        cliente = Cliente.get_by_id(cliente_id)
    except DoesNotExist:
        return None

    # Guardar detalles viejos para devolver stock temporalmente
    old_detalles = list(pedido.detalles)

    # Devolver stock de los detalles actuales antes de comprobar nuevos items
    for d in old_detalles:
        ajustar_stock(d.producto.producto_id, d.cantidad)

    # Verificar disponibilidad de los nuevos items
    nuevos_detalles_info = []
    monto_total = 0
    for item in items:
        producto = get_producto(item["producto_id"])
        if not producto:
            # Revertir: volver a restar el stock antiguo (para dejar estado previo)
            for od in old_detalles:
                ajustar_stock(od.producto.producto_id, -od.cantidad)
            return None
        cantidad = item.get("cantidad", 1)
        if producto.stock < cantidad:
            # Revertir saldo antiguo
            for od in old_detalles:
                ajustar_stock(od.producto.producto_id, -od.cantidad)
            return None
        subtotal = float(producto.precio) * cantidad
        monto_total += subtotal
        nuevos_detalles_info.append(
            {
                "producto": producto,
                "cantidad": cantidad,
                "precio_unitario": producto.precio,
                "colaborador": producto.colaborador,
                "notas_personalizacion": item.get("notas_personalizacion"),
            }
        )

    # Si llegamos aquí, hay stock para los nuevos items.
    # Borrar detalles antiguos y crear los nuevos (ya hemos repuesto stock viejo)
    DetallePedido.delete().where(DetallePedido.pedido == pedido).execute()

    for nd in nuevos_detalles_info:
        DetallePedido.create(
            pedido=pedido,
            producto=nd["producto"],
            cantidad=nd["cantidad"],
            precio_unitario=nd["precio_unitario"],
            colaborador=nd["colaborador"],
            notas_personalizacion=nd.get("notas_personalizacion"),
        )
        # Restar stock por los nuevos items
        ajustar_stock(nd["producto"].producto_id, -nd["cantidad"])

    # Actualizar campos del pedido
    pedido.cliente = cliente
    pedido.metodo_pago = metodo_pago
    pedido.direccion_entrega = direccion_entrega
    pedido.instrucciones_entrega = instrucciones_entrega
    pedido.monto_total = monto_total
    pedido.save()
    return pedido


def delete_pedido(pedido_id: int) -> bool:
    """Elimina un pedido y devuelve el stock de sus productos. Devuelve True si se eliminó."""
    pedido = get_pedido(pedido_id)
    if not pedido:
        return False
    # Devolver stock de cada detalle
    for detalle in list(pedido.detalles):
        ajustar_stock(detalle.producto.producto_id, detalle.cantidad)
    # Borrar detalles y pedido
    DetallePedido.delete().where(DetallePedido.pedido == pedido).execute()
    pedido.delete_instance()
    return True