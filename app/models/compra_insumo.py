"""
Modelo Peewee para registrar las compras de insumos. Cada registro
representa una entrada en el inventario de materia prima.
"""

from peewee import Model, AutoField, ForeignKeyField, DateField, DecimalField, CharField

from app.db.peewee_conn import database
from app.models.insumo import Insumo


class CompraInsumo(Model):
    """Modelo para registrar las compras de insumos.

    Cada compra incrementa el inventario del insumo correspondiente. El
    identificador ``compra_id`` es la clave primaria.
    """

    compra_id = AutoField(column_name="compra_id", primary_key=True)
    insumo = ForeignKeyField(
        Insumo,
        backref="compras",
        column_name="insumo_id",
        field=Insumo.insumo_id,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    fecha_compra = DateField()
    cantidad_compra = DecimalField(max_digits=10, decimal_places=2, auto_round=True)
    costo_total = DecimalField(max_digits=10, decimal_places=2, auto_round=True)
    proveedor = CharField(max_length=100, null=True)

    class Meta:
        database = database
        table_name = "compras_insumo"