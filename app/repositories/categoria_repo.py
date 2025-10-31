"""
Funciones de acceso a datos para el modelo `Categoria`. Se utilizan en
las rutas para encapsular la lógica de interacción con la base de
datos y mantener el código organizado.
"""

from typing import List, Optional

from app.models.categoria import Categoria


def create_categoria(data: dict) -> Categoria:
    """Crea una nueva categoría.

    Args:
        data: diccionario con los campos `nombre` y `descripcion`.

    Returns:
        Instancia de `Categoria` recién creada.
    """
    return Categoria.create(**data)


def get_categoria(categoria_id: int) -> Optional[Categoria]:
    """Obtiene una categoría por su identificador.

    Args:
        categoria_id: valor de la clave primaria ``categoria_id``.

    Returns:
        La instancia de ``Categoria`` si existe o ``None`` si no se encuentra.
    """
    try:
        return Categoria.get(Categoria.categoria_id == categoria_id)
    except Categoria.DoesNotExist:
        return None


def list_categorias(
    q: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    order_by: str = "categoria_id",
    desc: bool = False,
) -> List[Categoria]:
    """Lista categorías con búsqueda y ordenamiento.

    - q: busca en nombre y descripción
    - limit: número máximo de resultados
    - offset: desplazamiento
    - order_by: campo de ordenación (por defecto id)
    - desc: indica orden descendente
    """
    query = Categoria.select()
    if q:
        query = query.where(
            (Categoria.nombre.contains(q)) | (Categoria.descripcion.contains(q))
        )
    total = query.count()
    # Obtener el campo de ordenamiento. Si el nombre no existe, usar ``categoria_id``.
    field = getattr(Categoria, order_by, Categoria.categoria_id)
    query = query.order_by(field.desc() if desc else field.asc()).limit(limit).offset(offset)
    return list(query), total


def update_categoria(categoria_id: int, data: dict) -> Optional[Categoria]:
    """Actualiza una categoría y devuelve la nueva instancia si tuvo éxito."""
    q = Categoria.update(**data).where(Categoria.categoria_id == categoria_id)
    updated = q.execute()
    if updated:
        return Categoria.get_by_id(categoria_id)
    return None


def delete_categoria(categoria_id: int) -> bool:
    """Elimina una categoría. Devuelve True si se eliminó al menos un registro."""
    return bool(Categoria.delete().where(Categoria.categoria_id == categoria_id).execute())