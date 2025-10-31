"""
Módulo principal de la aplicación FastAPI para la tienda de ropa. Este
archivo configura CORS, registra los routers de cada recurso y
establece eventos de inicio y cierre para conectar y cerrar la
conexión a la base de datos. Sigue la arquitectura del repositorio
`tep` adaptada para un sistema de ecommerce de ropa y accesorios.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.categorias import router as categorias_router
from app.api.routers.tallas import router as tallas_router
from app.api.routers.patrones import router as patrones_router
from app.api.routers.colaboradores import router as colaboradores_router
from app.api.routers.clientes import router as clientes_router
from app.api.routers.productos import router as productos_router
from app.api.routers.insumos import router as insumos_router
from app.api.routers.compras_insumo import router as compras_insumo_router
from app.api.routers.usos_insumo import router as usos_insumo_router
from app.api.routers.pedidos import router as pedidos_router
from app.core.config import CORS_ORIGINS
from app.db.peewee_conn import db_session, database
from app.models.categoria import Categoria
from app.models.talla import Talla
from app.models.patron import Patron
from app.models.colaborador import Colaborador
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.models.insumo import Insumo
from app.models.compra_insumo import CompraInsumo
from app.models.uso_insumo import UsoInsumo
from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido


app = FastAPI(title="API Tienda de Ropa", version="1.0.0")

# Configurar CORS para permitir peticiones desde los orígenes definidos en variables de entorno
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(categorias_router)
app.include_router(tallas_router)
app.include_router(patrones_router)
app.include_router(colaboradores_router)
app.include_router(clientes_router)
app.include_router(productos_router)
app.include_router(insumos_router)
app.include_router(compras_insumo_router)
app.include_router(usos_insumo_router)
app.include_router(pedidos_router)


@app.on_event("startup")
def on_startup() -> None:
    """Evento disparado al iniciar la aplicación. Conecta la base de
    datos y crea las tablas si no existen. En un entorno de
    producción se recomienda utilizar migraciones en lugar de
    crear tablas automáticamente.
    """
    # Abrir conexión a la base de datos
    db_session.connect_db()
    # Crear tablas si no existen
    database.create_tables(
        [
            Categoria,
            Talla,
            Patron,
            Colaborador,
            Cliente,
            Producto,
            Insumo,
            CompraInsumo,
            UsoInsumo,
            Pedido,
            DetallePedido,
        ],
        safe=True,
    )


@app.on_event("shutdown")
def on_shutdown() -> None:
    """Evento disparado al detener la aplicación. Cierra la conexión a
    la base de datos."""
    db_session.close_db()