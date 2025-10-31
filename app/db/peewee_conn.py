"""
Módulo de conexión a la base de datos. Define una instancia global de
`peewee.MySQLDatabase` utilizando los valores de configuración. Proporciona
helpers para abrir y cerrar la conexión y para serializar modelos a
diccionarios (evitando recursión y simplificando las respuestas).
"""

from peewee import MySQLDatabase
from playhouse.shortcuts import model_to_dict

from app.core.config import settings


# Instancia global de la base de datos. Peewee se encargará de
# administrar la conexión internamente.
database = MySQLDatabase(
    settings.DB_NAME,
    user=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
)


class db_session:
    """Helpers para manejar la conexión a la base de datos en eventos de
    inicio y cierre de la aplicación FastAPI.
    """

    @staticmethod
    def connect_db() -> None:
        """Abre la conexión si está cerrada."""
        if database.is_closed():
            database.connect(reuse_if_open=True)

    @staticmethod
    def close_db(exc: Exception | None = None) -> None:
        """Cierra la conexión si está abierta."""
        if not database.is_closed():
            database.close()


def to_dict(instance, **kwargs):
    """Convierte un modelo Peewee en un diccionario. El parámetro
    `recurse=False` evita expandir relaciones anidadas automáticamente.
    """
    return model_to_dict(instance, recurse=False, **kwargs)