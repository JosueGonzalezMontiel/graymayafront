"""
Rutas para gestionar los insumos o materias primas. Permiten
crear, consultar, listar, actualizar y eliminar insumos. El
inventario de insumos se ajusta al registrar compras o consumos en
otros módulos. Todas las operaciones están protegidas por una clave
de API.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Security
from fastapi.responses import StreamingResponse
import io
from docxtpl import DocxTemplate

from app.api.deps import get_api_key
from app.db.peewee_conn import to_dict
from app.repositories.colaborador_repo import list_colaboradores
from app.repositories.insumo_repo import (
    create_insumo,
    delete_insumo,
    get_insumo,
    list_insumos,
    update_insumo,
)
from app.schemas.insumo import (
    InsumoCreate,
    InsumoUpdate,
    InsumoOut,
    InsumoList,
)


router = APIRouter(
    prefix="/insumos",
    tags=["insumos"],
    dependencies=[Security(get_api_key)],
)


@router.post("", response_model=InsumoOut, status_code=201)
def create_insumo_endpoint(payload: InsumoCreate):
    """Crea un nuevo insumo."""
    insumo = create_insumo(payload.model_dump())
    return to_dict(insumo)


@router.get("/{insumo_id}", response_model=InsumoOut)
def get_insumo_endpoint(insumo_id: int):
    """Obtiene un insumo por su ID."""
    insumo = get_insumo(insumo_id)
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return to_dict(insumo)


@router.get("", response_model=InsumoList)
def list_insumos_endpoint(
    q: Optional[str] = Query(
        None,
        description="Buscar por nombre, descripción, marca o color",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query(
        "insumo_id",
        description="Campo por el cual ordenar (insumo_id, nombre_insumo, marca)",
    ),
    desc: bool = Query(
        False,
        description="Indica si el orden debe ser descendente",
    ),
):
    """Lista insumos con búsqueda y paginación"""
    insumos, total = list_insumos(q=q, limit=limit, offset=offset, order_by=order_by, desc=desc)
    items = [to_dict(i) for i in insumos]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "count": len(items),
        "items": items,
    }


@router.put("/{insumo_id}", response_model=InsumoOut)
def update_insumo_endpoint(insumo_id: int, payload: InsumoUpdate):
    """Actualiza un insumo."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = update_insumo(insumo_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Insumo no encontrado o sin cambios")
    return to_dict(updated)


@router.delete("/{insumo_id}", status_code=204)
def delete_insumo_endpoint(insumo_id: int):
    """Elimina un insumo."""
    ok = delete_insumo(insumo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return None


@router.get("/export/resguardo", response_class=StreamingResponse)
def export_resguardo_endpoint(
    colaborador_nombre: str = Query(..., description="Nombre del colaborador"),
    q: Optional[str] = Query(None, description="Filtro de búsqueda en insumos"),
    order_by: str = Query("insumo_id"),
    desc: bool = Query(False),
):
    """Genera documento de resguardo de inventario usando plantilla Word con Jinja2."""
    
    # 1. Buscar colaborador por nombre
    colaboradores, _ = list_colaboradores(q=colaborador_nombre, limit=1, offset=0)
    if not colaboradores:
        raise HTTPException(status_code=404, detail="Colaborador no encontrado")
    colaborador = colaboradores[0]
    
    # 2. Obtener todos los insumos (sin límite para el documento)
    insumos, _ = list_insumos(q=q, limit=10000, offset=0, order_by=order_by, desc=desc)
    
    # 3. Cargar plantilla Word con docxtpl
    template_path = "docs/resguardo de inventario.docx"
    try:
        doc = DocxTemplate(template_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar plantilla: {str(e)}")
    
    # 4. Preparar lista de insumos como diccionarios para la tabla
    rows = []
    suma_total = 0.0
    for insumo in insumos:
        costo = float(insumo.costo_unitario or 0)
        stock = float(insumo.stock_insumo or 0)
        subtotal = costo * stock
        suma_total += subtotal
        
        rows.append({
            'id_insumo': insumo.insumo_id,
            'nombre_insumo': insumo.nombre_insumo or "",
            'descripcion': insumo.descripcion or "",
            'marca': insumo.marca or "",
            'color': insumo.color or "",
            'unidad_medida': insumo.unidad_medida or "",
            'stock_insumo': stock,
            'costo_unitario': costo,
        })
    
    # 5. Preparar contexto completo para la plantilla Jinja2
    context = {
        'marca': colaborador.nombre or "",
        'nombre': colaborador.nombre or "",
        'contacto': colaborador.contacto or "",
        'detalle_acuerdo': colaborador.detalle_acuerdo or "",
        'fecha': datetime.now().strftime("%d/%m/%Y"),
        'rows': rows,
        'suma': f"${suma_total:,.2f}",
    }
    
    # 6. Renderizar la plantilla con el contexto
    try:
        doc.render(context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al renderizar plantilla: {str(e)}")
    
    # 7. Guardar en memoria y devolver
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    filename = f"resguardo_{colaborador.nombre.replace(' ', '_')}.docx"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )