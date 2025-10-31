"""
Modelo Peewee para los colaboradores o proveedores externos. Se utiliza
para marcar productos en colaboración y para calcular comisiones.
"""

from peewee import Model, AutoField, CharField

from app.db.peewee_conn import database


class Colaborador(Model):
    """Modelo para los colaboradores o proveedores.

    El campo ``colaborador_id`` es la clave primaria. Los campos
    ``nombre``, ``contacto`` y ``detalle_acuerdo`` almacenan la
    información básica del colaborador o proveedor.
    """

    colaborador_id = AutoField(column_name="colaborador_id", primary_key=True)
    nombre = CharField(max_length=100)
    contacto = CharField(max_length=100, null=True)
    detalle_acuerdo = CharField(max_length=255, null=True)

    class Meta:
        database = database
        table_name = "colaboradores"