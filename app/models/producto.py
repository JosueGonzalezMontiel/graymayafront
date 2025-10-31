"""
Modelo Peewee para los productos. Incluye los atributos comunes a
prendas y accesorios, así como campos específicos para las prendas
(talla, género, tipo de prenda, patrón tie‑dye, tipo de sudadera,
indicador de colaboración) y para asociar un colaborador cuando
corresponde.
"""

from datetime import datetime

from peewee import (
    Model,
    AutoField,
    CharField,
    ForeignKeyField,
    IntegerField,
    DecimalField,
    BooleanField,
    DateTimeField,
    TextField,
)

from app.db.peewee_conn import database
from app.models.categoria import Categoria
from app.models.talla import Talla
from app.models.patron import Patron
from app.models.colaborador import Colaborador


class Producto(Model):
    """Modelo para los productos de la tienda.

    Este modelo representa tanto prendas como accesorios. Incluye
    referencias a las tablas ``categorias``, ``tallas``, ``patrones`` y
    ``colaboradores`` mediante claves foráneas explícitas. El campo
    ``producto_id`` es la clave primaria autoincremental.
    """

    producto_id = AutoField(column_name="producto_id", primary_key=True)
    nombre_producto = CharField(max_length=100)
    descripcion = TextField(null=True)
    precio = DecimalField(max_digits=10, decimal_places=2, auto_round=True)
    stock = IntegerField(default=0)
    url_imagen = CharField(max_length=255, null=True)
    categoria_id = ForeignKeyField(
        Categoria,
        backref="productos",
        column_name="categoria_id",
        field=Categoria.categoria_id,
        on_delete="RESTRICT",
        on_update="CASCADE",
    )
    talla = ForeignKeyField(
        Talla,
        backref="productos",
        column_name="talla_id",
        field=Talla.talla_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    color = CharField(max_length=50, null=True)
    genero = CharField(max_length=10, null=True)  # Hombre, Mujer, Unisex
    tipo_prenda = CharField(max_length=10, null=True)  # BASICA, ESTAMPADA, TIEDYE
    patron = ForeignKeyField(
        Patron,
        backref="productos",
        column_name="patron_id",
        field=Patron.patron_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    es_colaboracion = BooleanField(default=False)
    colaborador = ForeignKeyField(
        Colaborador,
        backref="productos",
        column_name="colaborador_id",
        field=Colaborador.colaborador_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    detalle_colaboracion = TextField(null=True)
    sudadera_tipo = CharField(max_length=20, null=True)  # Cerrada, Con cierre
    fecha_creacion = DateTimeField(default=datetime.utcnow)
    activo = BooleanField(default=True)

    class Meta:
        database = database
        table_name = "productos"