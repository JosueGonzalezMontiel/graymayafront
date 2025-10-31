"""
Modelo Peewee para los clientes de la tienda. Incluye campos de
autenticación básicos y un indicador de administrador para acceder a
funciones de gestión.
"""

from peewee import (Model, AutoField, CharField, BooleanField)

from app.db.peewee_conn import database


class Cliente(Model):
    """Modelo para los clientes.

    El campo ``cliente_id`` es la clave primaria autoincremental. Los
    campos ``email`` y ``usuario`` se marcan como únicos cuando
    corresponda. ``telefono`` no es único dado que puede repetirse.
    """

    cliente_id = AutoField(column_name="cliente_id", primary_key=True)
    nombre = CharField(max_length=100)
    telefono = CharField(max_length=20, null=True)
    email = CharField(max_length=100, null=True, unique=True)
    direccion = CharField(max_length=255, null=True)
    usuario = CharField(max_length=50, unique=True)
    password = CharField(max_length=255)
    es_admin = BooleanField(default=False)

    class Meta:
        database = database
        table_name = "clientes"