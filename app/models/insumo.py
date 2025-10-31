"""
Modelo Peewee para los insumos o materias primas utilizados en la
fabricación de prendas personalizadas. Permite llevar un control de
existencias y costos.
"""

from peewee import Model, AutoField, CharField, DecimalField

from app.db.peewee_conn import database


class Insumo(Model):
    """Modelo para los insumos o materia prima.

    El campo ``insumo_id`` es la clave primaria. Los demás campos
    describen el insumo y permiten controlar el stock y el costo
    unitario.
    """

    insumo_id = AutoField(column_name="insumo_id", primary_key=True)
    nombre_insumo = CharField(max_length=100)
    descripcion = CharField(max_length=255, null=True)
    marca = CharField(max_length=50, null=True)
    color = CharField(max_length=50, null=True)
    unidad_medida = CharField(max_length=20, null=True)
    stock_insumo = DecimalField(max_digits=10, decimal_places=2, default=0, auto_round=True)
    costo_unitario = DecimalField(max_digits=10, decimal_places=2, null=True, auto_round=True)

    class Meta:
        database = database
        table_name = "insumos"