"""
Funciones de acceso a datos para el modelo `Producto`. Además de
operaciones CRUD básicas, se incluyen utilidades para ajustar el
inventario cuando se realiza una venta.
"""

from typing import List, Optional

from app.models.producto import Producto


def create_producto(data: dict) -> Producto:
    """Crea un nuevo producto. Los campos deben corresponder con
    `Producto`.
    """
    return Producto.create(**data)


def get_producto(producto_id: int) -> Optional[Producto]:
    try:
        return Producto.get(Producto.producto_id == producto_id)
    except Producto.DoesNotExist:
        return None


# La función de listado ahora permite búsqueda y ordenamiento similares a los
# recursos_m del proyecto TEP. Puede filtrar por una cadena en nombre,
# descripción o color del producto, ordenar por cualquier campo y paginar.
def list_productos(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "producto_id",
    desc: bool = False,
) -> List[Producto]:
    """Devuelve una lista de productos con filtros de búsqueda y ordenamiento.

    - q: texto para buscar en nombre_producto, descripcion y color
    - limit: máximo de registros a devolver
    - offset: número de registros a saltar (paginación)
    - order_by: nombre del campo por el que ordenar (si no existe se usa id)
    - desc: si True ordena descendente
    """
    query = Producto.select()
    if q:
        query = query.where(
            (Producto.nombre_producto.contains(q))
            | (Producto.tipo_prenda.contains(q))
            | (Producto.talla_id.contains(q))
        )
    total = query.count()
    # obtener el campo de ordenamiento, si no existe usar id
    # obtener el campo de ordenamiento, si no existe usar producto_id
    field = getattr(Producto, order_by, Producto.producto_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_producto(producto_id: int, data: dict) -> Optional[Producto]:
    if Producto.update(**data).where(Producto.producto_id == producto_id).execute():
        return Producto.get_by_id(producto_id)
    return None


def delete_producto(producto_id: int) -> bool:
    return bool(Producto.delete().where(Producto.producto_id == producto_id).execute())


def ajustar_stock(producto_id: int, cantidad: int) -> bool:
    """Disminuye (o incrementa) el stock de un producto. Si la resta daría
    un valor negativo, no se realiza y se devuelve False.
    """
    producto = get_producto(producto_id)
    if not producto:
        return False
    nuevo_stock = producto.stock + cantidad
    # `cantidad` puede ser negativo (venta) o positivo (cancelación)
    if nuevo_stock < 0:
        return False
    producto.stock = nuevo_stock
    producto.save()
    return True