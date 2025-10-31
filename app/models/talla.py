"""
Modelo Peewee para las tallas de prendas. Permite normalizar las
distintas tallas disponibles (CH, M, G, XL, etc.).
"""

from peewee import Model, AutoField, CharField

from app.db.peewee_conn import database


class Talla(Model):
    """Modelo para la tabla de tallas.

    El campo ``talla_id`` es la clave primaria autoincremental. El campo
    ``nombre_talla`` almacena el nombre o código de la talla (ej. CH, M,
    G, XL).
    """

    talla_id = AutoField(column_name="talla_id", primary_key=True)
    nombre_talla = CharField(max_length=10)

    class Meta:
        database = database
        table_name = "tallas"