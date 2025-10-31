"""
Modelo Peewee para la tabla de categorías. Una categoría clasifica los
productos (sudaderas, playeras, lentes, joyería, etc.).
"""

from peewee import Model, AutoField, CharField

from app.db.peewee_conn import database


class Categoria(Model):
    """Modelo para la tabla de categorías.

    Este modelo define un catálogo de categorías de productos. El campo
    ``categoria_id`` es la clave primaria. Los campos ``nombre`` y
    ``descripcion`` representan el nombre y la descripción de la
    categoría, respectivamente.
    """

    categoria_id = AutoField(column_name="categoria_id", primary_key=True)
    nombre = CharField(max_length=50)
    descripcion = CharField(max_length=255, null=True)

    class Meta:
        database = database
        table_name = "categorias"