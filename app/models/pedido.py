"""
Modelo Peewee para las órdenes de compra (pedidos). Cada pedido
pertenece a un cliente y puede contener múltiples productos a través
de la tabla de detalles.
"""

from datetime import datetime

from peewee import (
    Model,
    AutoField,
    ForeignKeyField,
    DateTimeField,
    CharField,
    DecimalField,
    TextField,
)

from app.db.peewee_conn import database
from app.models.cliente import Cliente


class Pedido(Model):
    """Modelo para los pedidos (órdenes de compra).

    Cada pedido pertenece a un cliente mediante la clave foránea
    ``cliente_id``. El identificador ``pedido_id`` es la clave primaria.
    """

    pedido_id = AutoField(column_name="pedido_id", primary_key=True)
    cliente = ForeignKeyField(
        Cliente,
        backref="pedidos",
        column_name="cliente_id",
        field=Cliente.cliente_id,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    fecha_pedido = DateTimeField(default=datetime.utcnow)
    metodo_pago = CharField(max_length=20)  # EFECTIVO, DEPOSITO
    estatus = CharField(max_length=20, default="POR PAGAR")  # POR PAGAR, PAGADO, ENTREGADO, CANCELADO
    monto_total = DecimalField(max_digits=10, decimal_places=2, default=0, auto_round=True)
    direccion_entrega = TextField(null=True)
    instrucciones_entrega = TextField(null=True)

    class Meta:
        database = database
        table_name = "pedidos"