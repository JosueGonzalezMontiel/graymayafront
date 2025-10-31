"""
Modelo Peewee para los detalles de un pedido. Permite desglosar
cuántas unidades de cada producto se vendieron en un pedido, su
precio unitario y otra información relevante como notas de
personalización y si la comisión del colaborador ya fue liquidada.
"""

from peewee import (
    Model,
    AutoField,
    ForeignKeyField,
    IntegerField,
    DecimalField,
    BooleanField,
    CharField,
)

from app.db.peewee_conn import database
from app.models.pedido import Pedido
from app.models.producto import Producto
from app.models.colaborador import Colaborador


class DetallePedido(Model):
    """Modelo para el detalle de cada pedido.

    Desglosa los productos y cantidades incluidos en un pedido. La
    clave primaria es ``detalle_id``. Incluye referencias explícitas a
    ``Pedido``, ``Producto`` y ``Colaborador`` mediante sus claves
    foráneas.
    """

    detalle_id = AutoField(column_name="detalle_id", primary_key=True)
    pedido = ForeignKeyField(
        Pedido,
        backref="detalles",
        column_name="pedido_id",
        field=Pedido.pedido_id,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    producto = ForeignKeyField(
        Producto,
        backref="detalles",
        column_name="producto_id",
        field=Producto.producto_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    cantidad = IntegerField()
    precio_unitario = DecimalField(max_digits=10, decimal_places=2, auto_round=True)
    colaborador = ForeignKeyField(
        Colaborador,
        column_name="colaborador_id",
        field=Colaborador.colaborador_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    comision_pagada = BooleanField(default=False)
    notas_personalizacion = CharField(max_length=255, null=True)

    class Meta:
        database = database
        table_name = "detalle_pedido"
        indexes = (("pedido", "producto"), True)