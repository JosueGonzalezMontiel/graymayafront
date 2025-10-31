"""
Modelo Peewee para registrar el consumo de insumos en la producción de
prendas o en pedidos personalizados. Permite conocer cuánto material se
utiliza y cuándo.
"""

from peewee import Model, AutoField, ForeignKeyField, DecimalField, DateField, CharField

from app.db.peewee_conn import database
from app.models.insumo import Insumo
from app.models.producto import Producto
from app.models.pedido import Pedido


class UsoInsumo(Model):
    """Modelo para registrar el consumo de insumos.

    Los registros de esta tabla permiten llevar control de la cantidad
    consumida de un insumo en la producción de un producto o en un
    pedido personalizado. El campo ``uso_id`` es la clave primaria.
    """

    uso_id = AutoField(column_name="uso_id", primary_key=True)
    insumo = ForeignKeyField(
        Insumo,
        backref="usos",
        column_name="insumo_id",
        field=Insumo.insumo_id,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    producto = ForeignKeyField(
        Producto,
        backref="usos",
        column_name="producto_id",
        field=Producto.producto_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    pedido = ForeignKeyField(
        Pedido,
        backref="usos",
        column_name="pedido_id",
        field=Pedido.pedido_id,
        null=True,
        on_delete="SET NULL",
        on_update="CASCADE",
    )
    cantidad_usada = DecimalField(max_digits=10, decimal_places=2, auto_round=True)
    fecha_uso = DateField()
    notas = CharField(max_length=255, null=True)

    class Meta:
        database = database
        table_name = "uso_insumo"