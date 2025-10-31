"""
Modelo Peewee para los patrones tie-dye. Cada patrón tiene un código y
un nombre descriptivo, así como una descripción opcional.
"""

from peewee import Model, AutoField, CharField

from app.db.peewee_conn import database


class Patron(Model):
    """Modelo para los patrones tie‑dye.

    Cada patrón tiene un identificador ``patron_id`` como clave primaria,
    un ``codigo_patron`` corto (p. ej., "ESP"), un ``nombre_patron`` más
    descriptivo y una ``descripcion`` opcional.
    """

    patron_id = AutoField(column_name="patron_id", primary_key=True)
    codigo_patron = CharField(max_length=10)
    nombre_patron = CharField(max_length=50)
    descripcion = CharField(max_length=255, null=True)

    class Meta:
        database = database
        table_name = "patrones"