import { notificaciones } from "./src/js/utils/notificaciones.js";
// ========================================
// CONFIGURACIÓN Y API CLIENT
// ========================================
class APIClient {
  constructor() {
    // Cambia API_BASE si tu backend corre en otro origen (ej: http://localhost:8000)
    this.API_BASE = window.__API_BASE__ || "http://localhost:8000";
    // Clave por defecto definida en app/core/config.py (puedes sobreescribirla en producción)
    this.API_KEY = window.__API_KEY__ || "dev_key_gms_330455";
  }

  async fetch(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // Descargar binarios (Blob) respetando cabecera X-API-KEY
  async fetchBlob(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.blob();
  }

  // Helpers para referencias CRUD simples
  async fetchReference(resource) {
    const res = await this.fetch(`/${resource}?limit=200&offset=0`);
    if (res && res.items) return res.items;
    return Array.isArray(res) ? res : [];
  }
  async createReference(resource, payload) {
    return this.fetch(`/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  async updateReference(resource, id, payload) {
    return this.fetch(`/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  async deleteReference(resource, id) {
    return this.fetch(`/${resource}/${id}`, { method: "DELETE" });
  }

  // Descarga contenido de texto (por ejemplo CSV) respetando el header X-API-KEY
  async fetchText(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${msg || res.statusText}`);
    }
    return res.text();
  }
}

// ========================================
// SUBMODULO: Inventario (Insumos, Compras de Insumo, Usos de Insumo)
// - Tres tablas con filtros, CRUD según API disponible y exportación de resguardo
// ========================================
class InventarioAdmin {
  static async render() {
    const card = document.getElementById("inventario-admin-card");
    if (!card) return;

    card.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h3>Inventario</h3>
        </div>

        <ul class="nav nav-tabs" id="inventarioTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="tab-insumos" data-bs-toggle="tab" data-bs-target="#pane-insumos" type="button" role="tab">Insumos</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="tab-compras" data-bs-toggle="tab" data-bs-target="#pane-compras" type="button" role="tab">Compras</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="tab-usos" data-bs-toggle="tab" data-bs-target="#pane-usos" type="button" role="tab">Usos</button>
          </li>
        </ul>

        <div class="tab-content pt-3">
          <!-- INSUMOS -->
          <div class="tab-pane fade show active" id="pane-insumos" role="tabpanel" aria-labelledby="tab-insumos">
            <div class="admin-toolbar container-fluid px-0 mb-3">
              <div class="row g-2 align-items-end">
                <div class="col-12 col-md-3">
                  <label class="form-label">Buscar</label>
                  <input type="text" id="insumo_q" class="form-control" placeholder="Nombre, marca, color...">
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Ordenar por</label>
                  <select id="insumo_order_by" class="form-select">
                    <option value="insumo_id">ID</option>
                    <option value="nombre_insumo">Nombre</option>
                    <option value="marca">Marca</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Desc</label>
                  <select id="insumo_desc" class="form-select">
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div class="col-12 col-md-5 d-flex flex-wrap gap-2">
                  <button id="btnBuscarInsumos" class="btn btn-primary-custom flex-fill"><i class="bi bi-search"></i> Buscar</button>
                  <button id="btnNuevoInsumo" class="btn btn-success flex-fill"><i class="bi bi-plus-circle"></i> Nuevo Insumo</button>
                </div>
              </div>
            </div>

            <div class="admin-toolbar container-fluid px-0 mb-3">
              <div class="row g-2 align-items-end">
                <div class="col-12 col-md-4">
                  <label class="form-label">Colaborador para Resguardo</label>
                  <select id="resguardo_colaborador" class="form-select"></select>
                </div>
                <div class="col-12 col-md-3">
                  <label class="form-label">Filtro adicional (opcional)</label>
                  <input type="text" id="resguardo_q" class="form-control" placeholder="Filtro en insumos">
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Ordenar</label>
                  <select id="resguardo_order_by" class="form-select">
                    <option value="insumo_id">ID</option>
                    <option value="nombre_insumo">Nombre</option>
                    <option value="marca">Marca</option>
                  </select>
                </div>
                <div class="col-6 col-md-1">
                  <label class="form-label">Desc</label>
                  <select id="resguardo_desc" class="form-select">
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div class="col-12 col-md-2 d-grid">
                  <button id="btnExportResguardo" class="btn btn-outline-light"><i class="bi bi-file-earmark-word"></i> Resguardo</button>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="admin-table" id="insumos-table">
                <thead>
                  <tr>
                    <th class="text-center col-min" style="max-width:60px;">ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Marca</th>
                    <th>Color</th>
                    <th>Unidad</th>
                    <th class="text-center">Stock</th>
                    <th class="text-center">Costo Unit.</th>
                    <th class="col-actions text-center" style="width:110px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="9" class="text-center">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- COMPRAS INSUMO -->
          <div class="tab-pane fade" id="pane-compras" role="tabpanel" aria-labelledby="tab-compras">
            <div class="admin-toolbar container-fluid px-0 mb-3">
              <div class="row g-2 align-items-end">
                <div class="col-12 col-md-3">
                  <label class="form-label">Buscar</label>
                  <input type="text" id="compra_q" class="form-control" placeholder="Insumo o proveedor">
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Ordenar por</label>
                  <select id="compra_order_by" class="form-select">
                    <option value="compra_id">ID</option>
                    <option value="fecha_compra">Fecha</option>
                    <option value="cantidad_compra">Cantidad</option>
                    <option value="costo_total">Costo Total</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Desc</label>
                  <select id="compra_desc" class="form-select">
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div class="col-12 col-md-4 d-flex flex-wrap gap-2">
                  <button id="btnBuscarCompras" class="btn btn-primary-custom flex-fill"><i class="bi bi-search"></i> Buscar</button>
                  <button id="btnNuevaCompra" class="btn btn-success flex-fill"><i class="bi bi-plus-circle"></i> Nueva Compra</button>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="admin-table" id="compras-table">
                <thead>
                  <tr>
                    <th class="text-center col-min" style="max-width:60px;">ID</th>
                    <th>Insumo ID</th>
                    <th>Fecha</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-center">Costo Total</th>
                    <th>Proveedor</th>
                    <th class="col-actions text-center" style="width:80px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="7" class="text-center">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- USOS INSUMO -->
          <div class="tab-pane fade" id="pane-usos" role="tabpanel" aria-labelledby="tab-usos">
            <div class="admin-toolbar container-fluid px-0 mb-3">
              <div class="row g-2 align-items-end">
                <div class="col-12 col-md-3">
                  <label class="form-label">Buscar</label>
                  <input type="text" id="uso_q" class="form-control" placeholder="Insumo, producto o notas">
                </div>
                <div class="col-6 col-md-3">
                  <label class="form-label">Ordenar por</label>
                  <select id="uso_order_by" class="form-select">
                    <option value="uso_id">ID</option>
                    <option value="fecha_uso">Fecha</option>
                    <option value="cantidad_usada">Cantidad</option>
                  </select>
                </div>
                <div class="col-6 col-md-2">
                  <label class="form-label">Desc</label>
                  <select id="uso_desc" class="form-select">
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div class="col-12 col-md-4 d-flex flex-wrap gap-2">
                  <button id="btnBuscarUsos" class="btn btn-primary-custom flex-fill"><i class="bi bi-search"></i> Buscar</button>
                  <button id="btnNuevoUso" class="btn btn-success flex-fill"><i class="bi bi-plus-circle"></i> Nuevo Uso</button>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="admin-table" id="usos-table">
                <thead>
                  <tr>
                    <th class="text-center col-min" style="max-width:60px;">ID</th>
                    <th>Insumo ID</th>
                    <th>Producto ID</th>
                    <th>Pedido ID</th>
                    <th>Fecha</th>
                    <th class="text-center">Cantidad</th>
                    <th>Notas</th>
                    <th class="col-actions text-center" style="width:80px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="8" class="text-center">Cargando...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Llenar select de colaboradores para resguardo
    const colSel = document.getElementById("resguardo_colaborador");
    if (colSel) {
      const opciones = (cache.colaboradores || []).map(
        (c) =>
          `<option value="${Utils.escapeHtml(c.nombre)}">${Utils.escapeHtml(
            c.nombre
          )}</option>`
      );
      colSel.innerHTML =
        `<option value="">Seleccionar colaborador...</option>` +
        opciones.join("");
    }

    // Listeners Insumos
    document
      .getElementById("btnBuscarInsumos")
      ?.addEventListener("click", () => this.refreshInsumos());
    document
      .getElementById("btnNuevoInsumo")
      ?.addEventListener("click", () => this.openInsumoForm());
    document
      .getElementById("btnExportResguardo")
      ?.addEventListener("click", () => this.exportResguardo());

    // Listeners Compras
    document
      .getElementById("btnBuscarCompras")
      ?.addEventListener("click", () => this.refreshCompras());
    document
      .getElementById("btnNuevaCompra")
      ?.addEventListener("click", () => this.openCompraForm());

    // Listeners Usos
    document
      .getElementById("btnBuscarUsos")
      ?.addEventListener("click", () => this.refreshUsos());
    document
      .getElementById("btnNuevoUso")
      ?.addEventListener("click", () => this.openUsoForm());

    // Cargar tablas por defecto
    await Promise.all([
      this.refreshInsumos(),
      this.refreshCompras(),
      this.refreshUsos(),
    ]);
  }

  // --------------- INSUMOS ---------------
  static async refreshInsumos() {
    const q = document.getElementById("insumo_q")?.value?.trim() || "";
    const order_by =
      document.getElementById("insumo_order_by")?.value || "insumo_id";
    const desc = document.getElementById("insumo_desc")?.value || "false";
    const qs = new URLSearchParams({
      limit: "200",
      offset: "0",
      order_by,
      desc,
    });
    if (q) qs.set("q", q);
    try {
      const res = await API.fetch(`/insumos?${qs.toString()}`);
      const items = res.items || [];
      const tbody = document.querySelector("#insumos-table tbody");
      if (!tbody) return;
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No hay insumos</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map(
          (i) => `
        <tr data-id="${i.insumo_id}">
          <td class="text-center">${i.insumo_id}</td>
          <td>${Utils.escapeHtml(i.nombre_insumo)}</td>
          <td>${Utils.escapeHtml(i.descripcion || "")}</td>
          <td>${Utils.escapeHtml(i.marca || "")}</td>
          <td>${Utils.escapeHtml(i.color || "")}</td>
          <td>${Utils.escapeHtml(i.unidad_medida || "")}</td>
          <td class="text-center">${i.stock_insumo ?? 0}</td>
          <td class="text-center">${
            i.costo_unitario != null ? `$${i.costo_unitario}` : "-"
          }</td>
          <td class="col-actions text-center">
            <button class="btn btn-warning btn-sm edit-insumo" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm del-insumo" title="Eliminar"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `
        )
        .join("");

      tbody.querySelectorAll(".edit-insumo").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = btn.closest("tr").dataset.id;
          try {
            const item = await API.fetch(`/insumos/${id}`);
            InventarioAdmin.openInsumoForm(item);
          } catch (err) {
            notificaciones("No se pudo cargar el insumo", "error");
          }
        });
      });
      tbody.querySelectorAll(".del-insumo").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = btn.closest("tr").dataset.id;
          if (!confirm("¿Eliminar insumo " + id + " ?")) return;
          try {
            await API.deleteReference("insumos", id);
            notificaciones("Insumo eliminado");
            await InventarioAdmin.refreshInsumos();
          } catch (err) {
            notificaciones("Error eliminando: " + err.message, "error");
          }
        });
      });
    } catch (err) {
      const tbody = document.querySelector("#insumos-table tbody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="9" class="text-danger text-center">Error cargando insumos</td></tr>`;
    }
  }

  static openInsumoForm(item = null) {
    let modalEl = document.getElementById("insumoModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "insumoModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Insumo</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="insumoForm">
                <input type="hidden" id="insumo_id">
                <div class="row g-2">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Nombre *</label>
                    <input id="nombre_insumo" class="form-control form-control-dark" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Marca</label>
                    <input id="marca" class="form-control form-control-dark">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea id="descripcion" class="form-control form-control-dark" rows="2"></textarea>
                </div>
                <div class="row g-2">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Color</label>
                    <input id="color" class="form-control form-control-dark">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Unidad de medida</label>
                    <input id="unidad_medida" class="form-control form-control-dark">
                  </div>
                  <div class="col-md-2 mb-3">
                    <label class="form-label">Stock</label>
                    <input id="stock_insumo" type="number" step="0.01" class="form-control form-control-dark" value="0">
                  </div>
                  <div class="col-md-2 mb-3">
                    <label class="form-label">Costo Unit.</label>
                    <input id="costo_unitario" type="number" step="0.01" class="form-control form-control-dark">
                  </div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary-custom" type="submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modalEl);

      const form = modalEl.querySelector("#insumoForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = modalEl.querySelector("#insumo_id").value || null;
        const payload = {
          nombre_insumo: modalEl.querySelector("#nombre_insumo").value,
          descripcion: modalEl.querySelector("#descripcion").value || null,
          marca: modalEl.querySelector("#marca").value || null,
          color: modalEl.querySelector("#color").value || null,
          unidad_medida: modalEl.querySelector("#unidad_medida").value || null,
          stock_insumo:
            modalEl.querySelector("#stock_insumo").value !== ""
              ? parseFloat(modalEl.querySelector("#stock_insumo").value)
              : 0,
          costo_unitario:
            modalEl.querySelector("#costo_unitario").value !== ""
              ? parseFloat(modalEl.querySelector("#costo_unitario").value)
              : null,
        };
        try {
          if (id) {
            await API.fetch(`/insumos/${id}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            });
            notificaciones("Insumo actualizado");
          } else {
            await API.fetch("/insumos", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            notificaciones("Insumo creado");
          }
          const bs =
            bootstrap.Modal.getInstance(modalEl) ||
            new bootstrap.Modal(modalEl);
          bs.hide();
          await InventarioAdmin.refreshInsumos();
        } catch (err) {
          notificaciones("Error guardando: " + err.message, "error");
        }
      });
    }

    // Rellenar valores
    modalEl.querySelector("#insumo_id").value = item?.insumo_id || "";
    modalEl.querySelector("#nombre_insumo").value = item?.nombre_insumo || "";
    modalEl.querySelector("#descripcion").value = item?.descripcion || "";
    modalEl.querySelector("#marca").value = item?.marca || "";
    modalEl.querySelector("#color").value = item?.color || "";
    modalEl.querySelector("#unidad_medida").value = item?.unidad_medida || "";
    modalEl.querySelector("#stock_insumo").value = item?.stock_insumo ?? 0;
    modalEl.querySelector("#costo_unitario").value = item?.costo_unitario ?? "";

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  static async exportResguardo() {
    const nombre =
      document.getElementById("resguardo_colaborador")?.value || "";
    if (!nombre) return notificaciones("Selecciona un colaborador", "warning");
    const q = document.getElementById("resguardo_q")?.value?.trim() || "";
    const order_by =
      document.getElementById("resguardo_order_by")?.value || "insumo_id";
    const desc = document.getElementById("resguardo_desc")?.value || "false";
    const qs = new URLSearchParams({
      colaborador_nombre: nombre,
      order_by,
      desc,
    });
    if (q) qs.set("q", q);
    try {
      const blob = await API.fetchBlob(
        `/insumos/export/resguardo?${qs.toString()}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resguardo_${nombre.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notificaciones("Documento generado");
    } catch (err) {
      notificaciones("Error generando documento: " + err.message, "error");
    }
  }

  // --------------- COMPRAS ---------------
  static async refreshCompras() {
    const q = document.getElementById("compra_q")?.value?.trim() || "";
    const order_by =
      document.getElementById("compra_order_by")?.value || "compra_id";
    const desc = document.getElementById("compra_desc")?.value || "false";
    const qs = new URLSearchParams({
      limit: "200",
      offset: "0",
      order_by,
      desc,
    });
    if (q) qs.set("q", q);
    try {
      const res = await API.fetch(`/compras-insumo?${qs.toString()}`);
      const items = res.items || [];
      const tbody = document.querySelector("#compras-table tbody");
      if (!tbody) return;
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay compras registradas</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map((c) => {
          const fecha = c.fecha_compra
            ? new Date(c.fecha_compra).toLocaleDateString()
            : "";
          const costo =
            c.costo_total != null ? Number(c.costo_total).toFixed(2) : "0.00";
          return `
          <tr data-id="${c.compra_id}">
            <td class="text-center">${c.compra_id}</td>
            <td>${c.insumo_id}</td>
            <td>${fecha}</td>
            <td class="text-center">${c.cantidad_compra}</td>
            <td class="text-center">$${costo}</td>
            <td>${Utils.escapeHtml(c.proveedor || "")}</td>
            <td class="col-actions text-center">
              <button class="btn btn-info btn-sm view-compra" title="Ver"><i class="bi bi-eye"></i></button>
            </td>
          </tr>`;
        })
        .join("");

      tbody.querySelectorAll(".view-compra").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.closest("tr").dataset.id;
          try {
            const item = await API.fetch(`/compras-insumo/${id}`);
            InventarioAdmin.showCompraDetalle(item);
          } catch (err) {
            notificaciones("No se pudo cargar la compra", "error");
          }
        });
      });
    } catch (err) {
      const tbody = document.querySelector("#compras-table tbody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Error cargando compras</td></tr>`;
    }
  }

  static async openCompraForm() {
    // Cargar insumos para el select
    let insumosList = [];
    try {
      const res = await API.fetch("/insumos?limit=200");
      insumosList = res.items || [];
    } catch (e) {
      notificaciones("No se pudieron cargar insumos", "error");
      return;
    }

    let modalEl = document.getElementById("compraInsumoModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "compraInsumoModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Nueva Compra de Insumo</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="compraInsumoForm">
                <div class="mb-3">
                  <label class="form-label">Insumo *</label>
                  <select id="ci_insumo_id" class="form-select" required></select>
                </div>
                <div class="row g-2">
                  <div class="col-6 mb-3">
                    <label class="form-label">Fecha *</label>
                    <input type="date" id="ci_fecha" class="form-control" required>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label">Proveedor</label>
                    <input type="text" id="ci_proveedor" class="form-control" maxlength="100">
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6 mb-3">
                    <label class="form-label">Cantidad *</label>
                    <input type="number" step="0.01" id="ci_cantidad" class="form-control" required>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label">Costo Total *</label>
                    <input type="number" step="0.01" id="ci_costo" class="form-control" required>
                  </div>
                </div>
                <div class="text-end">
                  <button type="submit" class="btn btn-primary-custom">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modalEl);

      modalEl
        .querySelector("#compraInsumoForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const payload = {
            insumo_id: parseInt(document.getElementById("ci_insumo_id").value),
            fecha_compra: document.getElementById("ci_fecha").value,
            cantidad_compra: parseFloat(
              document.getElementById("ci_cantidad").value
            ),
            costo_total: parseFloat(document.getElementById("ci_costo").value),
            proveedor: document.getElementById("ci_proveedor").value || null,
          };
          try {
            await API.fetch("/compras-insumo", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            notificaciones("Compra registrada");
            const bs =
              bootstrap.Modal.getInstance(modalEl) ||
              new bootstrap.Modal(modalEl);
            bs.hide();
            await InventarioAdmin.refreshCompras();
            await InventarioAdmin.refreshInsumos(); // stock se actualiza
          } catch (err) {
            notificaciones("Error guardando: " + err.message, "error");
          }
        });
    }

    const select = modalEl.querySelector("#ci_insumo_id");
    select.innerHTML = insumosList
      .map(
        (i) =>
          `<option value="${i.insumo_id}">${Utils.escapeHtml(
            i.nombre_insumo
          )}</option>`
      )
      .join("");
    modalEl.querySelector("#ci_fecha").value = new Date()
      .toISOString()
      .slice(0, 10);
    modalEl.querySelector("#ci_proveedor").value = "";
    modalEl.querySelector("#ci_cantidad").value = "";
    modalEl.querySelector("#ci_costo").value = "";

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  static showCompraDetalle(item) {
    const html = `
      <div class="modal fade" id="compraDetalleModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Compra #${item.compra_id}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <ul class="list-unstyled mb-0">
                <li><strong>Insumo ID:</strong> ${item.insumo_id}</li>
                <li><strong>Fecha:</strong> ${Utils.escapeHtml(
                  item.fecha_compra
                )}</li>
                <li><strong>Cantidad:</strong> ${item.cantidad_compra}</li>
                <li><strong>Costo Total:</strong> $${Number(
                  item.costo_total
                ).toFixed(2)}</li>
                <li><strong>Proveedor:</strong> ${Utils.escapeHtml(
                  item.proveedor || ""
                )}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("compraDetalleModal");
    const bs = new bootstrap.Modal(modalEl);
    bs.show();
    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }

  // --------------- USOS ---------------
  static async refreshUsos() {
    const q = document.getElementById("uso_q")?.value?.trim() || "";
    const order_by = document.getElementById("uso_order_by")?.value || "uso_id";
    const desc = document.getElementById("uso_desc")?.value || "false";
    const qs = new URLSearchParams({
      limit: "200",
      offset: "0",
      order_by,
      desc,
    });
    if (q) qs.set("q", q);
    try {
      const res = await API.fetch(`/usos-insumo?${qs.toString()}`);
      const items = res.items || [];
      const tbody = document.querySelector("#usos-table tbody");
      if (!tbody) return;
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay usos registrados</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map((u) => {
          const fecha = u.fecha_uso
            ? new Date(u.fecha_uso).toLocaleDateString()
            : "";
          return `
          <tr data-id="${u.uso_id}">
            <td class="text-center">${u.uso_id}</td>
            <td>${u.insumo_id}</td>
            <td>${u.producto_id ?? "-"}</td>
            <td>${u.pedido_id ?? "-"}</td>
            <td>${fecha}</td>
            <td class="text-center">${u.cantidad_usada}</td>
            <td>${Utils.escapeHtml(u.notas || "")}</td>
            <td class="col-actions text-center">
              <button class="btn btn-info btn-sm view-uso" title="Ver"><i class="bi bi-eye"></i></button>
            </td>
          </tr>`;
        })
        .join("");

      tbody.querySelectorAll(".view-uso").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.closest("tr").dataset.id;
          try {
            const item = await API.fetch(`/usos-insumo/${id}`);
            InventarioAdmin.showUsoDetalle(item);
          } catch (err) {
            notificaciones("No se pudo cargar el uso", "error");
          }
        });
      });
    } catch (err) {
      const tbody = document.querySelector("#usos-table tbody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="8" class="text-danger text-center">Error cargando usos</td></tr>`;
    }
  }

  static async openUsoForm() {
    // Cargar insumos, productos y pedidos
    let insumosList = [];
    let productosList = [];
    let pedidosList = [];
    try {
      const [insRes, prodRes, pedRes] = await Promise.all([
        API.fetch("/insumos?limit=200"),
        API.fetch("/productos?limit=200"),
        API.fetch("/pedidos?limit=200"),
      ]);
      insumosList = insRes.items || [];
      productosList = prodRes.items || prodRes || [];
      pedidosList = pedRes.items || pedRes || [];
    } catch (e) {
      notificaciones("No se pudieron cargar opciones", "error");
      return;
    }

    let modalEl = document.getElementById("usoInsumoModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "usoInsumoModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Nuevo Uso de Insumo</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="usoInsumoForm">
                <div class="mb-3">
                  <label class="form-label">Insumo *</label>
                  <select id="ui_insumo_id" class="form-select" required></select>
                </div>
                <div class="row g-2">
                  <div class="col-6 mb-3">
                    <label class="form-label">Producto</label>
                    <select id="ui_producto_id" class="form-select"></select>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label">Pedido</label>
                    <select id="ui_pedido_id" class="form-select"></select>
                  </div>
                </div>
                <div class="row g-2">
                  <div class="col-6 mb-3">
                    <label class="form-label">Fecha *</label>
                    <input type="date" id="ui_fecha" class="form-control" required>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label">Cantidad *</label>
                    <input type="number" step="0.01" id="ui_cantidad" class="form-control" required>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Notas</label>
                  <textarea id="ui_notas" class="form-control" rows="2"></textarea>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary-custom" type="submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modalEl);

      modalEl
        .querySelector("#usoInsumoForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const payload = {
            insumo_id: parseInt(document.getElementById("ui_insumo_id").value),
            producto_id: document.getElementById("ui_producto_id").value
              ? parseInt(document.getElementById("ui_producto_id").value)
              : null,
            pedido_id: document.getElementById("ui_pedido_id").value
              ? parseInt(document.getElementById("ui_pedido_id").value)
              : null,
            cantidad_usada: parseFloat(
              document.getElementById("ui_cantidad").value
            ),
            fecha_uso: document.getElementById("ui_fecha").value,
            notas: document.getElementById("ui_notas").value || null,
          };
          try {
            await API.fetch("/usos-insumo", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            notificaciones("Uso registrado");
            const bs =
              bootstrap.Modal.getInstance(modalEl) ||
              new bootstrap.Modal(modalEl);
            bs.hide();
            await InventarioAdmin.refreshUsos();
            await InventarioAdmin.refreshInsumos(); // stock se actualiza
          } catch (err) {
            notificaciones("Error guardando: " + err.message, "error");
          }
        });
    }

    const selInsumo = modalEl.querySelector("#ui_insumo_id");
    selInsumo.innerHTML = insumosList
      .map(
        (i) =>
          `<option value="${i.insumo_id}">${Utils.escapeHtml(
            i.nombre_insumo
          )}</option>`
      )
      .join("");

    const selProducto = modalEl.querySelector("#ui_producto_id");
    selProducto.innerHTML =
      '<option value="">N/A</option>' +
      productosList
        .map(
          (p) =>
            `<option value="${p.producto_id}">${Utils.escapeHtml(
              p.nombre_producto || p.nombre || "Producto " + p.producto_id
            )}</option>`
        )
        .join("");

    const selPedido = modalEl.querySelector("#ui_pedido_id");
    selPedido.innerHTML =
      '<option value="">N/A</option>' +
      pedidosList
        .map(
          (p) =>
            `<option value="${p.pedido_id}">Pedido #${p.pedido_id}</option>`
        )
        .join("");

    modalEl.querySelector("#ui_fecha").value = new Date()
      .toISOString()
      .slice(0, 10);
    modalEl.querySelector("#ui_cantidad").value = "";
    modalEl.querySelector("#ui_notas").value = "";

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  static showUsoDetalle(item) {
    const html = `
      <div class="modal fade" id="usoDetalleModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Uso #${item.uso_id}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <ul class="list-unstyled mb-0">
                <li><strong>Insumo ID:</strong> ${item.insumo_id}</li>
                <li><strong>Producto ID:</strong> ${
                  item.producto_id ?? "-"
                }</li>
                <li><strong>Pedido ID:</strong> ${item.pedido_id ?? "-"}</li>
                <li><strong>Fecha:</strong> ${Utils.escapeHtml(
                  item.fecha_uso
                )}</li>
                <li><strong>Cantidad:</strong> ${item.cantidad_usada}</li>
                <li><strong>Notas:</strong> ${Utils.escapeHtml(
                  item.notas || ""
                )}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const modalEl = document.getElementById("usoDetalleModal");
    const bs = new bootstrap.Modal(modalEl);
    bs.show();
    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());
  }
}

const API = new APIClient();
// Exponer API globalmente para uso en signup/login
window.API = API;

// ========================================
// UTILIDADES (helpers)
// ========================================
class Utils {
  // Normaliza rutas de media/imágenes que vienen desde la base de datos.
  static normalizeMediaUrl(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) return path;
    let p = String(path).replace(/\\\\/g, "/").replace(/\\/g, "/");
    p = p.replace(/^\.\//, "");
    p = p.replace(/^\//, "");
    return p;
  }

  // Escapar HTML para evitar inyección cuando insertamos en innerHTML
  static escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Nombre legible desde distintos formatos de objetos de referencia
  static displayNameFor(obj) {
    if (!obj) return "";
    return (
      obj.nombre ??
      obj.nombre_talla ??
      obj.nombre_patron ??
      obj.codigo_patron ??
      obj.label ??
      obj.name ??
      ""
    );
  }

  // Normalizar texto a slug (se usa en filtros)
  static slugify(text) {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }
}

// ========================================
// DATOS LOCALES (fallback) y CACHE GLOBAL
// ========================================
// Productos locales (fallback). Se eliminaron duplicados innecesarios manteniendo los datos.
const productosData = {
  graymayas: [
    {
      id: 1,
      nombre: "Sudadera Negra Premium",
      descripcion: "Sudadera con cierre de alta calidad",
      precio: 899,
      stock: true,
      imagen: "/black-premium-hoodie-with-zipper.jpg",
      categoria: "sudaderas-cierre",
    },
    {
      id: 2,
      nombre: "Sudadera Cerrada Classic",
      descripcion: "Diseño minimalista y cómodo",
      precio: 799,
      stock: true,
      imagen: "/black-pullover-hoodie-minimal.jpg",
      categoria: "sudaderas-cerradas",
    },
    {
      id: 3,
      nombre: "Playera Graymaya Edition",
      descripcion: "Edición limitada con logo bordado",
      precio: 499,
      stock: false,
      imagen: "/black-t-shirt-with-embroidered-logo.jpg",
      categoria: "playeras",
    },
    {
      id: 4,
      nombre: "Sudadera Oversized",
      descripcion: "Corte holgado estilo urbano",
      precio: 949,
      stock: true,
      imagen: "/oversized-black-hoodie-streetwear.png",
      categoria: "sudaderas-cerradas",
    },
    {
      id: 5,
      nombre: "Playera Long Fit",
      descripcion: "Corte largo para look moderno",
      precio: 549,
      stock: true,
      imagen: "/long-fit-black-t-shirt.jpg",
      categoria: "playeras",
    },
    {
      id: 6,
      nombre: "Sudadera Tech Fabric",
      descripcion: "Tela técnica de alto rendimiento",
      precio: 1099,
      stock: true,
      imagen: "/technical-fabric-black-hoodie.jpg",
      categoria: "sudaderas-cierre",
    },
  ],
  basicos: [
    {
      id: 7,
      nombre: "Camiseta Básica Negra",
      descripcion: "Esencial para cualquier guardarropa",
      precio: 299,
      stock: true,
      imagen: "/basic-black-t-shirt.jpg",
      categoria: "camisetas",
    },
    {
      id: 8,
      nombre: "Camiseta Blanca Premium",
      descripcion: "Algodón 100% de alta calidad",
      precio: 349,
      stock: true,
      imagen: "/premium-white-t-shirt.png",
      categoria: "camisetas",
    },
    {
      id: 9,
      nombre: "Pantalón Cargo Negro",
      descripcion: "Múltiples bolsillos funcionales",
      precio: 699,
      stock: true,
      imagen: "/black-cargo-pants.png",
      categoria: "pantalones",
    },
    {
      id: 10,
      nombre: "Camiseta Gris Melange",
      descripcion: "Tela suave y transpirable",
      precio: 299,
      stock: true,
      imagen: "/gray-melange-t-shirt.jpg",
      categoria: "camisetas",
    },
    {
      id: 11,
      nombre: "Pantalón Jogger",
      descripcion: "Comodidad y estilo urbano",
      precio: 649,
      stock: false,
      imagen: "/black-jogger-pants.jpg",
      categoria: "pantalones",
    },
    {
      id: 12,
      nombre: "Pack 3 Camisetas",
      descripcion: "Negro, blanco y gris",
      precio: 799,
      stock: true,
      imagen: "/3-pack-basic-t-shirts.jpg",
      categoria: "camisetas",
    },
  ],
  accesorios: [
    {
      id: 13,
      nombre: "Gorra Snapback",
      descripcion: "Logo bordado frontal",
      precio: 399,
      stock: true,
      imagen: "/black-snapback-cap.png",
      categoria: "gorras",
    },
    {
      id: 14,
      nombre: "Mochila Urban",
      descripcion: "Compartimento para laptop",
      precio: 899,
      stock: true,
      imagen: "/black-urban-backpack.jpg",
      categoria: "mochilas",
    },
    {
      id: 15,
      nombre: "Gorra Dad Hat",
      descripcion: "Estilo clásico ajustable",
      precio: 349,
      stock: true,
      imagen: "/black-dad-hat.jpg",
      categoria: "gorras",
    },
    {
      id: 16,
      nombre: "Calcetines Pack 5",
      descripcion: "Algodón premium",
      precio: 249,
      stock: true,
      imagen: "/black-socks-pack.jpg",
      categoria: "otros",
    },
    {
      id: 17,
      nombre: "Mochila Mini",
      descripcion: "Perfecta para lo esencial",
      precio: 599,
      stock: false,
      imagen: "/black-mini-backpack.jpg",
      categoria: "mochilas",
    },
    {
      id: 18,
      nombre: "Gorra Beanie",
      descripcion: "Tejido suave para invierno",
      precio: 299,
      stock: true,
      imagen: "/black-beanie-hat.jpg",
      categoria: "gorras",
    },
  ],
  colaboraciones: [
    {
      id: 19,
      nombre: "Collab Artist Series 01",
      descripcion: "Diseño exclusivo edición limitada",
      precio: 1299,
      stock: true,
      imagen: "/limited-edition-artist-collaboration-hoodie.jpg",
      categoria: "disponibles",
    },
    {
      id: 20,
      nombre: "Collab Street Edition",
      descripcion: "Colaboración con artista urbano",
      precio: 1499,
      stock: false,
      imagen: "/street-art-collaboration-t-shirt.jpg",
      categoria: "disponibles",
    },
    {
      id: 21,
      nombre: "Collab Future Drop",
      descripcion: "Próximamente - Reserva ya",
      precio: 1399,
      stock: false,
      imagen: "/placeholder.svg?height=300&width=300",
      categoria: "proximamente",
    },
    {
      id: 22,
      nombre: "Collab Designer Series",
      descripcion: "Colaboración con diseñador emergente",
      precio: 1599,
      stock: true,
      imagen: "/placeholder.svg?height=300&width=300",
      categoria: "disponibles",
    },
    {
      id: 23,
      nombre: "Collab Music Edition",
      descripcion: "Inspirado en la cultura musical",
      precio: 1199,
      stock: true,
      imagen: "/placeholder.svg?height=300&width=300",
      categoria: "disponibles",
    },
    {
      id: 24,
      nombre: "Collab Next Gen",
      descripcion: "Próximamente - Suscríbete",
      precio: 1499,
      stock: false,
      imagen: "/placeholder.svg?height=300&width=300",
      categoria: "proximamente",
    },
  ],
};

// Cache local para referencias (categorías, tallas, patrones, colaboradores)
const cache = {
  categorias: [],
  tallas: [],
  patrones: [],
  colaboradores: [],
  productos: [],
};

// ========================================
// CONSTANTES DE MAPEOS
// ========================================
const MENU_CATEGORY_MAP = {
  graymayas: [13, 14, 21],
  basicos: [1, 12, 2],
  accesorios: [3, 31, 32],
  colaboraciones: [41, 42, 43],
};

// ========================================
// MÓDULO: Sistema de Routing y App
// ========================================
class App {
  constructor() {
    // Rutas mapeadas a instancias o funciones
    this.routes = {
      inicio: () => InicioPage.render(),
      graymayas: () => CatalogoPage.render("graymayas", "Graymayas"),
      basicos: () => CatalogoPage.render("basicos", "Básicos"),
      accesorios: () => CatalogoPage.render("accesorios", "Accesorios"),
      colaboraciones: () =>
        CatalogoPage.render("colaboraciones", "Colaboraciones"),
      login: () => LoginPage.render(),
      signup: () => SignupPage.render(),
      "panel-control": () => PanelControlPage.render(),
    };
  }

  navigateTo(page) {
    window.history.pushState({}, "", `#${page}`);

    // Actualizar navbar activo
    document.querySelectorAll(".nav-link-custom").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-page") === page) {
        link.classList.add("active");
      }
    });

    // Cerrar navbar en móvil
    const navbarCollapse = document.getElementById("navbarNav");
    if (navbarCollapse && navbarCollapse.classList.contains("show")) {
      navbarCollapse.classList.remove("show");
    }

    // Renderizar
    if (this.routes[page]) {
      this.routes[page]();
    } else {
      this.routes.inicio();
    }

    // Mostrar/ocultar barra superior cuando entramos al panel de control
    try {
      const topNav = document.querySelector("nav.navbar");
      if (topNav) {
        if (page === "panel-control") {
          topNav.style.display = "none";
          document.body.style.paddingTop = "0";
        } else {
          topNav.style.display = "";
          document.body.style.paddingTop = null;
        }
      }
    } catch (err) {
      console.warn("No se pudo ajustar visibilidad de navbar:", err.message);
    }

    window.scrollTo(0, 0);
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      // Actualizar contador del carrito
      Cart.updateCounter();

      // Event listeners para navegación con [data-page]
      document.querySelectorAll("[data-page]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const page = link.getAttribute("data-page");
          this.navigateTo(page);
        });
      });

      // Cargar página inicial según hash
      const hash = window.location.hash.slice(1);
      this.navigateTo(hash || "inicio");

      window.addEventListener("popstate", () => {
        const hash = window.location.hash.slice(1);
        this.navigateTo(hash || "inicio");
      });
    });
  }
}

const app = new App();
// Exponer instancia global para navegación desde vistas dinámicas
window.app = app;

// ========================================
// MÓDULO: Carrito (funciones relacionadas al carrito)
// ========================================
class Cart {
  static agregarAlCarrito(productoId) {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    // Buscar en cache de productos traída desde la API
    let producto = null;
    const items = window.productosCache || [];
    producto = items.find((p) => (p.producto_id ?? p.id) === productoId);

    // Fallback a datos locales
    if (!producto) {
      for (const categoria in productosData) {
        producto = productosData[categoria].find((p) => p.id === productoId);
        if (producto) break;
      }
    }

    if (producto) {
      const id = producto.producto_id ?? producto.id;
      const itemExistente = carrito.find(
        (item) => (item.producto_id ?? item.id) === id
      );
      if (itemExistente) {
        itemExistente.cantidad++;
      } else {
        // Normalizar campos guardados en carrito
        const nombre = producto.nombre_producto ?? producto.nombre;
        const rawImg = producto.url_imagen ?? producto.imagen;
        const img = Utils.normalizeMediaUrl(rawImg);
        const precio = producto.precio ?? 0;
        carrito.push({
          producto_id: id,
          nombre,
          imagen: img,
          precio,
          cantidad: 1,
          notas_personalizacion: "",
        });
      }

      localStorage.setItem("carrito", JSON.stringify(carrito));
      Cart.updateCounter();
      notificaciones("Producto agregado al carrito");
    } else {
      notificaciones("Producto no encontrado");
    }
  }

  static updateCounter() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach((badge) => {
      badge.textContent = total;
    });
  }

  // Toggle panel carrito (abre/cierra)
  static toggleCarrito(event) {
    event.preventDefault();
    const panel = document.getElementById("carritoPanel");
    const overlay = document.getElementById("panelOverlay");
    const cuentaPanel = document.getElementById("cuentaPanel");

    if (cuentaPanel) cuentaPanel.classList.remove("active");
    if (panel) panel.classList.toggle("active");
    if (overlay) overlay.classList.toggle("active");

    if (panel && panel.classList.contains("active")) {
      Cart.cargarCarrito();
    }
  }

  static async toggleMiCuenta(event) {
    event.preventDefault();
    const panel = document.getElementById("cuentaPanel");
    const overlay = document.getElementById("panelOverlay");
    const carritoPanel = document.getElementById("carritoPanel");

    if (carritoPanel) carritoPanel.classList.remove("active");
    if (panel) panel.classList.toggle("active");
    if (overlay) overlay.classList.toggle("active");

    // Cargar información del usuario si el panel se está abriendo
    if (panel && panel.classList.contains("active")) {
      await Cart.cargarInformacionCuenta();
    }
  }

  static async cargarInformacionCuenta() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const cuentaBody = document.querySelector(".cuenta-body");

    if (!cuentaBody) return;

    // Si no hay usuario autenticado, mostrar mensaje
    if (!currentUser || !currentUser.cliente_id) {
      cuentaBody.innerHTML = `
        <div class="cuenta-section text-center">
          <p class="text-muted">Inicia sesión para ver tu información</p>
          <button class="btn btn-primary-custom" onclick="event.preventDefault(); if(window.LoginPage) window.LoginPage.render();">
            Iniciar Sesión
          </button>
        </div>
      `;
      return;
    }

    // Mostrar loader mientras carga
    cuentaBody.innerHTML = `
      <div class="cuenta-section text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    `;

    try {
      // Obtener pedidos del cliente
      const pedidosRes = await API.fetch(
        `/pedidos?cliente_id=${currentUser.cliente_id}&limit=100`
      );
      const pedidos = pedidosRes.items || pedidosRes || [];

      // Calcular promociones
      const tienePedidos = pedidos.length > 0;
      const tienePromocion = pedidos.length >= 3;

      // Renderizar información
      cuentaBody.innerHTML = `
        <div class="cuenta-section">
          <h6><i class="bi bi-person-circle"></i> Información Personal</h6>
          <p class="text-muted mb-1"><strong>Nombre:</strong> ${Utils.escapeHtml(
            currentUser.nombre || ""
          )} ${Utils.escapeHtml(currentUser.apellido || "")}</p>
          <p class="text-muted mb-1"><strong>Email:</strong> ${Utils.escapeHtml(
            currentUser.email || "No registrado"
          )}</p>
          ${
            currentUser.telefono
              ? `<p class="text-muted mb-1"><strong>Teléfono:</strong> ${Utils.escapeHtml(
                  currentUser.telefono
                )}</p>`
              : ""
          }
        </div>
        
        <div class="cuenta-section">
          <h6><i class="bi bi-bag-check"></i> Mis Compras</h6>
          ${
            tienePedidos
              ? `
            <div class="pedidos-list" style="max-height: 300px; overflow-y: auto;">
              ${pedidos
                .map(
                  (pedido) => `
                <div class="pedido-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f8f9fa;">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>Pedido #${pedido.pedido_id}</strong>
                      <br>
                      <small class="text-muted">
                        <i class="bi bi-calendar"></i> ${new Date(
                          pedido.fecha_pedido
                        ).toLocaleDateString("es-MX")}
                      </small>
                    </div>
                    <span class="badge" style="background-color: ${Cart._getStatusColorForBadge(
                      pedido.estatus
                    )}">
                      ${pedido.estatus}
                    </span>
                  </div>
                  <p class="mb-2"><strong>Total:</strong> $${(
                    pedido.monto_total || 0
                  ).toFixed(2)}</p>
                  <p class="mb-2 small text-muted"><strong>Método de Pago:</strong> ${
                    pedido.metodo_pago || "No especificado"
                  }</p>
                  ${
                    pedido.direccion_entrega
                      ? `<p class="mb-2 small text-muted"><strong>Entrega:</strong> ${Utils.escapeHtml(
                          pedido.direccion_entrega
                        )}</p>`
                      : ""
                  }
                  <button 
                    class="btn btn-sm btn-outline-primary w-100" 
                    onclick="Cart.editarPedidoDesdeCliente(${pedido.pedido_id})"
                  >
                    <i class="bi bi-pencil"></i> Ver/Editar Pedido
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `
            <p class="text-muted">No tienes compras recientes</p>
          `
          }
        </div>
        
        <div class="cuenta-section">
          <h6><i class="bi bi-tag"></i> Promociones</h6>
          ${
            tienePromocion
              ? `
            <div class="alert alert-success" style="padding: 12px; border-radius: 8px;">
              <i class="bi bi-gift-fill"></i> 
              <strong>¡Felicidades!</strong> Tienes una promoción disponible en tu próximo pedido. 
              Háznolo saber en la confirmación de tu pedido.
            </div>
          `
              : `
            <p class="text-muted">Aún no obtienes un descuento. Realiza más compras para obtener promociones.</p>
          `
          }
        </div>
        
        <div class="cuenta-section">
          <h6><i class="bi bi-envelope"></i> Contacto</h6>
          <p class="text-muted mb-1">graymayamx@gmail.com</p>
          <p class="text-muted mb-1">+52 5618372849</p>
        </div>
      `;
    } catch (error) {
      console.error("Error cargando información de cuenta:", error);
      cuentaBody.innerHTML = `
        <div class="cuenta-section">
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle"></i> 
            Error al cargar tu información. Por favor intenta de nuevo.
          </div>
        </div>
      `;
    }
  }

  static _getStatusColorForBadge(estatus) {
    const colors = {
      PENDIENTE: "#ffc107",
      EN_PROCESO: "#17a2b8",
      COMPLETADO: "#28a745",
      CANCELADO: "#dc3545",
      ENTREGADO: "#28a745",
    };
    return colors[estatus] || "#6c757d";
  }

  static async eliminarPedidoDesdeCliente(pedidoId) {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar este pedido?\n\nEsta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await API.deleteReference("pedidos", pedidoId);

      // Cerrar modal si existe
      const modal = document.getElementById("pedido-detalle-modal");
      if (modal) {
        modal.remove();
      }

      // Cerrar el panel de cuenta
      Cart.cerrarPaneles();

      notificaciones("Pedido eliminado correctamente");

      // Recargar la información de la cuenta si el panel se vuelve a abrir
      setTimeout(() => {
        Cart.cargarInformacionCuenta();
      }, 100);
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      notificaciones(
        "Error al eliminar el pedido. Por favor, intenta de nuevo.",
        "error"
      );
    }
  }

  static async editarPedidoDesdeCliente(pedidoId) {
    try {
      // Cerrar el panel de cuenta
      Cart.cerrarPaneles();

      // Obtener detalles del pedido
      const pedido = await API.fetch(`/pedidos/${pedidoId}`);

      if (!pedido) {
        notificaciones("No se pudo cargar el pedido", "error");
        return;
      }

      // Crear modal para ver/editar el pedido
      const modalHTML = `
        <div class="modal-overlay" id="ver-pedido-modal">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h3>Pedido #${pedido.pedido_id}</h3>
              <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info mb-3">
                <strong>Estado:</strong> <span class="badge" style="background-color: ${Cart._getStatusColorForBadge(
                  pedido.estatus
                )}">${pedido.estatus}</span>
                <br>
                <strong>Fecha:</strong> ${new Date(
                  pedido.fecha_pedido
                ).toLocaleString("es-MX")}
                <br>
                <strong>Método de Pago:</strong> ${
                  pedido.metodo_pago || "No especificado"
                }
              </div>

              ${
                pedido.direccion_entrega
                  ? `
                <div class="mb-3">
                  <strong>Dirección de Entrega:</strong>
                  <p class="text-muted">${Utils.escapeHtml(
                    pedido.direccion_entrega
                  )}</p>
                </div>
              `
                  : ""
              }

              ${
                pedido.instrucciones_entrega
                  ? `
                <div class="mb-3">
                  <strong>Instrucciones:</strong>
                  <p class="text-muted">${Utils.escapeHtml(
                    pedido.instrucciones_entrega
                  )}</p>
                </div>
              `
                  : ""
              }

              <h5>Productos</h5>
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(pedido.detalles || [])
                      .map(
                        (detalle) => `
                      <tr>
                        <td>${Utils.escapeHtml(
                          detalle.producto_nombre ||
                            `Producto ID: ${detalle.producto_id}`
                        )}</td>
                        <td>${detalle.cantidad}</td>
                        <td>$${(detalle.precio_unitario || 0).toFixed(2)}</td>
                        <td>$${(
                          (detalle.cantidad || 0) *
                          (detalle.precio_unitario || 0)
                        ).toFixed(2)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" class="text-end"><strong>Total:</strong></td>
                      <td><strong class="text-success">$${(
                        pedido.monto_total || 0
                      ).toFixed(2)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${
                pedido.estatus === "PENDIENTE"
                  ? `
                <div class="alert alert-warning mt-3">
                  <i class="bi bi-info-circle"></i> 
                  Si necesitas modificar este pedido, contacta con nosotros:
                  <br>
                  <strong>WhatsApp:</strong> +52 5618372849
                  <br>
                  <strong>Email:</strong> graymayamx@gmail.com
                </div>
              `
                  : ""
              }

              <div class="modal-footer" style="display: flex; justify-content: space-between;">
                <div>
                  ${
                    pedido.estatus === "PENDIENTE" ||
                    pedido.estatus === "POR PAGAR"
                      ? `
                    <button type="button" class="btn btn-danger" onclick="Cart.eliminarPedidoDesdeCliente(${pedido.pedido_id})">
                      <i class="bi bi-trash"></i> Eliminar Pedido
                    </button>
                  `
                      : ""
                  }
                </div>
                <div>
                  <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                  ${
                    pedido.estatus === "PENDIENTE" ||
                    pedido.estatus === "POR_PAGAR"
                      ? `
                    <button type="button" class="btn btn-primary-custom" onclick="this.closest('.modal-overlay').remove(); PedidosAdmin.openPedidoForm(${pedido.pedido_id})">
                      <i class="bi bi-pencil"></i> Editar Pedido
                    </button>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
    } catch (error) {
      console.error("Error cargando pedido:", error);
      notificaciones("Error al cargar el pedido", "error");
    }
  }

  static cerrarPaneles() {
    const carritoPanel = document.getElementById("carritoPanel");
    const cuentaPanel = document.getElementById("cuentaPanel");
    const overlay = document.getElementById("panelOverlay");
    if (carritoPanel) carritoPanel.classList.remove("active");
    if (cuentaPanel) cuentaPanel.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
  }

  static cargarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const carritoBody = document.getElementById("carritoBody");
    const carritoTotal = document.getElementById("carritoTotal");

    if (!carritoBody) return;

    if (carrito.length === 0) {
      carritoBody.innerHTML =
        '<p class="text-center text-muted">Tu carrito está vacío</p>';
      if (carritoTotal) carritoTotal.textContent = "$0";
      return;
    }

    let total = 0;
    carritoBody.innerHTML = carrito
      .map((item, index) => {
        total += item.precio * item.cantidad;
        const itemId = item.producto_id ?? item.id;
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        return `
            <div class="carrito-item" data-item-index="${index}">
                <img src="${item.imagen}" alt="${Utils.escapeHtml(
          item.nombre
        )}" class="carrito-item-img">
                <div class="carrito-item-info">
                    <div class="carrito-item-name">${Utils.escapeHtml(
                      item.nombre
                    )}</div>
                    <div class="carrito-item-price">$${item.precio.toFixed(
                      2
                    )} c/u</div>
                    <div class="carrito-item-cantidad">
                        <button class="btn-cantidad" onclick="Cart.cambiarCantidad(${itemId}, -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn-cantidad" onclick="Cart.cambiarCantidad(${itemId}, 1)">+</button>
                    </div>
                    <div class="carrito-item-subtotal">Subtotal: $${subtotal}</div>
                    <div class="carrito-item-notas mt-2">
                        <textarea 
                            class="form-control form-control-sm" 
                            placeholder="indique si quiere otro color o colores. Disponibles: Amarillo, Azul marino, Azul cielo, Arena, Cafe, Verde, Naranja, Rosa, Morado, Rojo, negro)" 
                            rows="2"
                            onchange="Cart.actualizarNotas(${index}, this.value)"
                        >${item.notas_personalizacion || ""}</textarea>
                    </div>
                    <button class="btn-eliminar mt-2" onclick="Cart.eliminarDelCarrito(${itemId})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
      })
      .join("");

    if (carritoTotal) carritoTotal.textContent = `$${total.toFixed(2)}`;
  }

  static actualizarNotas(index, notas) {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito[index]) {
      carrito[index].notas_personalizacion = notas;
      localStorage.setItem("carrito", JSON.stringify(carrito));
    }
  }

  static cambiarCantidad(productoId, cambio) {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const item = carrito.find((i) => (i.producto_id ?? i.id) === productoId);

    if (item) {
      item.cantidad += cambio;
      if (item.cantidad <= 0) {
        Cart.eliminarDelCarrito(productoId);
        return;
      }
      localStorage.setItem("carrito", JSON.stringify(carrito));
      Cart.cargarCarrito();
      Cart.updateCounter();
    }
  }

  static eliminarDelCarrito(productoId) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito = carrito.filter(
      (item) => (item.producto_id ?? item.id) !== productoId
    );
    localStorage.setItem("carrito", JSON.stringify(carrito));
    Cart.cargarCarrito();
    Cart.updateCounter();
  }

  static async procederAlPago() {
    // Verificar que el usuario esté autenticado
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    console.log("Verificando autenticación para checkout...");
    console.log("currentUser en localStorage:", currentUser);

    if (!currentUser || !currentUser.cliente_id) {
      console.warn("Usuario no autenticado o sin cliente_id");
      notificaciones(
        "Debes iniciar sesión para realizar una compra",
        "warning"
      );
      if (window.LoginPage) window.LoginPage.render();
      return;
    }

    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito.length === 0) {
      notificaciones("Tu carrito está vacío", "warning");
      return;
    }

    // Cerrar el panel del carrito
    Cart.cerrarPaneles();

    // Calcular total del carrito
    const totalCarrito = carrito.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );

    // Crear modal de checkout
    const modalHTML = `
      <div class="modal-overlay" id="checkout-modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>Finalizar Compra</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="checkout-form" class="admin-form">
              <input type="hidden" id="cliente_id" value="${
                currentUser.cliente_id
              }">
              
              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> 
                <strong>Cliente:</strong> ${Utils.escapeHtml(
                  currentUser.nombre || ""
                )} ${Utils.escapeHtml(currentUser.apellido || "")}
                ${
                  currentUser.email
                    ? `<br><strong>Email:</strong> ${Utils.escapeHtml(
                        currentUser.email
                      )}`
                    : ""
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="metodo_pago">Método de Pago *</label>
                  <select id="metodo_pago" required>
                    <option value="">Seleccionar método...</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="DEPOSITO">Depósito</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Método de Entrega *</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="metodo_entrega" id="envio_domicilio" value="envio" required>
                    <label class="form-check-label" for="envio_domicilio">
                      Envío a Domicilio (Costo adicional)
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="metodo_entrega" id="recoger_punto" value="recoleccion" required>
                    <label class="form-check-label" for="recoger_punto">
                      Recoger en Punto de Entrega
                    </label>
                  </div>
                </div>
              </div>

              <div id="direccion_envio_group" class="form-group" style="display: none;">
                <label for="direccion_entrega">Dirección de Entrega *</label>
                <textarea id="direccion_entrega" rows="2" placeholder="Ingresa tu dirección completa"></textarea>
              </div>

              <div id="instrucciones_group" class="form-group" style="display: none;">
                <label for="instrucciones_entrega" id="label_instrucciones">Instrucciones de Entrega</label>
                <textarea id="instrucciones_entrega" rows="2" placeholder="Referencias, horarios preferidos, etc."></textarea>
              </div>

              <hr>
              
              <div class="detalles-section">
                <h4>Resumen del Pedido</h4>
                
                <div class="table-responsive">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${carrito
                        .map((item) => {
                          const subtotal = (
                            item.precio * item.cantidad
                          ).toFixed(2);
                          return `
                          <tr>
                            <td>
                              <div class="d-flex align-items-center">
                                <img src="${
                                  item.imagen
                                }" alt="${Utils.escapeHtml(
                            item.nombre
                          )}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                                <span>${Utils.escapeHtml(item.nombre)}</span>
                              </div>
                            </td>
                            <td>${item.cantidad}</td>
                            <td>$${item.precio.toFixed(2)}</td>
                            <td><strong>$${subtotal}</strong></td>
                            <td>${
                              item.notas_personalizacion
                                ? Utils.escapeHtml(item.notas_personalizacion)
                                : "-"
                            }</td>
                          </tr>
                        `;
                        })
                        .join("")}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-end"><strong>Total:</strong></td>
                        <td colspan="2"><strong class="text-success">$${totalCarrito.toFixed(
                          2
                        )}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary-custom">
                  <i class="bi bi-check-circle"></i> Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Event listeners para métodos de entrega
    const radioEnvio = document.getElementById("envio_domicilio");
    const radioRecoleccion = document.getElementById("recoger_punto");
    const direccionGroup = document.getElementById("direccion_envio_group");
    const instruccionesGroup = document.getElementById("instrucciones_group");
    const direccionTextarea = document.getElementById("direccion_entrega");
    const instruccionesTextarea = document.getElementById(
      "instrucciones_entrega"
    );
    const labelInstrucciones = document.getElementById("label_instrucciones");

    radioEnvio.addEventListener("change", function () {
      if (this.checked) {
        // Mostrar campo de dirección
        direccionGroup.style.display = "block";
        direccionTextarea.required = true;
        direccionTextarea.placeholder = "Ingresa tu dirección completa";
        direccionTextarea.value = "";

        // Ocultar instrucciones
        instruccionesGroup.style.display = "none";
        instruccionesTextarea.required = false;
        instruccionesTextarea.value = "Contactar para coordinar envío";
      }
    });

    radioRecoleccion.addEventListener("change", function () {
      if (this.checked) {
        // Ocultar campo de dirección y establecer valor automático
        direccionGroup.style.display = "none";
        direccionTextarea.required = false;
        direccionTextarea.value = "Recolección en punto";

        // Mostrar campo de instrucciones para punto de recolección
        instruccionesGroup.style.display = "block";
        instruccionesTextarea.required = true;
        labelInstrucciones.innerHTML = "Punto de Recolección Elegido *";
        instruccionesTextarea.placeholder =
          "Escribe aquí el punto de recolección que elegiste";
        instruccionesTextarea.value = "";

        // Mostrar modal informativo de puntos de entrega
        Cart.mostrarPuntosEntrega();
      }
    });

    // Submit handler
    document
      .getElementById("checkout-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await Cart.submitCheckout();
      });
  }

  static async submitCheckout() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || !currentUser.cliente_id) {
      notificaciones("Error: No se pudo identificar al cliente", "error");
      return;
    }

    // Validar que se haya seleccionado método de entrega
    const metodoEntrega = document.querySelector(
      'input[name="metodo_entrega"]:checked'
    );
    if (!metodoEntrega) {
      notificaciones("Por favor selecciona un método de entrega", "warning");
      return;
    }

    // Recolectar datos del formulario
    // IMPORTANTE: El API espera "items" para crear (PedidoCreate), no "detalles"
    const formData = {
      cliente_id: currentUser.cliente_id,
      fecha_pedido: new Date().toISOString(),
      metodo_pago: document.getElementById("metodo_pago").value,
      estatus: "PENDIENTE",
      monto_total: carrito.reduce(
        (sum, item) => sum + item.precio * item.cantidad,
        0
      ),
      direccion_entrega:
        document.getElementById("direccion_entrega").value || null,
      instrucciones_entrega:
        document.getElementById("instrucciones_entrega").value || null,
      items: carrito.map((item) => ({
        producto_id: item.producto_id ?? item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        notas_personalizacion: item.notas_personalizacion || null,
        colaborador_id: null,
        comision_pagada: false,
      })),
    };

    console.log("Enviando pedido:", formData);

    try {
      const response = await API.createReference("pedidos", formData);

      // Limpiar carrito
      localStorage.removeItem("carrito");
      Cart.updateCounter();

      // Cerrar modal de checkout
      document.getElementById("checkout-modal").remove();

      // Mostrar modal de confirmación con WhatsApp
      Cart.mostrarModalWhatsApp(response, formData, carrito);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      notificaciones(
        `Error al procesar el pedido: ${
          error.message || "Error desconocido"
        }\n\nPor favor, intenta nuevamente.`,
        "error"
      );
    }
  }

  static mostrarPuntosEntrega() {
    // Verificar si el modal ya existe
    let modalPuntos = document.getElementById("puntos-entrega-modal");
    if (modalPuntos) {
      modalPuntos.remove();
    }

    const modalHTML = `
      <div class="modal-overlay" id="puntos-entrega-modal" style="z-index: 10000;">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <h3><i class="bi bi-geo-alt"></i> Puntos de Entrega Disponibles</h3>
            <button class="modal-close" onclick="document.getElementById('puntos-entrega-modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info" style="background: linear-gradient(to right, #00b09b, #96c93d, #e7c6e0ff);">
              <i class="bi bi-info-circle"></i>
              <strong>Importante:</strong> Se le contactará para confirmar su entrega y coordinar horarios.
            </div>
            
            <h5 class="mb-3">Nuestros Puntos de Recolección:</h5>
            
            <div class="punto-entrega mb-3 p-3" style="border: 1px solid #dee2e6; border-radius: 8px; background-color: #ffffffff;">
              <h6 class="text-primary" style="color: #020202ff !important;"><i class="bi bi-shop"></i> Punto Centro</h6>
              <p class="mb-1" style="color: #020202ff;"><strong>Dirección:</strong> Paseo Bravo a la altura de la Av.Juárez, Waltmart Reforma</p>
              <p class="mb-1" style="color: #020202ff;"><strong>Días:</strong> Martes</p>
              
            </div>

            <div class="punto-entrega mb-3 p-3" style="border: 1px solid #dee2e6; border-radius: 8px; background-color: #ffffffff;">
              <h6 class="text-primary" style="color: #020202ff !important;"><i class="bi bi-shop"></i> Punto Angelopolis</h6>
              <p class="mb-1" style="color: #020202ff;"><strong>Dirección:</strong> Enfrente de la Estrella de Puebla (Lado de restaurantes)</p>
              <p class="mb-1" style="color: #020202ff;"><strong>Días:</strong> Miercoles</p>
              
            </div>

            <div class="punto-entrega mb-3 p-3" style="border: 1px solid #dee2e6; border-radius: 8px; background-color: #ffffffff;">
              <h6 class="text-primary" style="color:rgba(37, 35, 35, 1) !important;"><i class="bi bi-shop"></i> Zona Galerias Serdan</h6>
              <p class="mb-1" style="color: #020202ff;"><strong>Dirección:</strong> Mega Serdán</p>
              <p class="mb-1" style="color: #020202ff;"><strong>Días:</strong> Lunes</p>
              
            </div>


          </div>
          <div class="modal-footer">
            <button class="btn btn-primary-custom" onclick="document.getElementById('puntos-entrega-modal').remove()">
              Entendido
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  static mostrarModalWhatsApp(response, formData, carrito) {
    // Construir mensaje de WhatsApp
    const pedidoId = response.pedido_id || "N/A";
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Formatear detalles del pedido
    let detallesProductos = "";
    carrito.forEach((item, index) => {
      detallesProductos += `\n${index + 1}. ${item.nombre} - Cantidad: ${
        item.cantidad
      } - Precio: $${item.precio.toFixed(2)}`;
      if (item.notas_personalizacion) {
        detallesProductos += `\n   Notas: ${item.notas_personalizacion}`;
      }
    });

    // Construir mensaje completo
    const mensaje =
      `🛍️ *NUEVO PEDIDO - Graymaya*\n\n` +
      `📋 *Número de Pedido:* ${pedidoId}\n\n` +
      `👤 *Cliente:* ${currentUser.nombre || ""} ${
        currentUser.apellido || ""
      }\n` +
      `📧 *Email:* ${currentUser.email || "N/A"}\n` +
      `📱 *Teléfono:* ${currentUser.telefono || "N/A"}\n\n` +
      `💳 *Método de Pago:* ${formData.metodo_pago}\n` +
      `📦 *Método de Entrega:* ${
        formData.direccion_entrega === "Recolección en punto"
          ? "Recoger en punto"
          : "Envío a domicilio"
      }\n` +
      `📍 *Dirección:* ${formData.direccion_entrega || "N/A"}\n` +
      `📝 *Instrucciones:* ${formData.instrucciones_entrega || "N/A"}\n\n` +
      `🛒 *PRODUCTOS:*${detallesProductos}\n\n` +
      `💰 *TOTAL:* $${formData.monto_total.toFixed(2)}\n\n` +
      `✅ Favor de confirmar este pedido.`;

    // Codificar mensaje para URL
    const mensajeEncoded = encodeURIComponent(mensaje);
    const whatsappURL = `https://wa.me/525618372849?text=${mensajeEncoded}`;

    // Crear modal
    const modalHTML = `
      <div class="modal-overlay" id="whatsapp-modal" style="z-index: 10001;">
        <div class="modal-content" style="max-width: 500px; text-align: center;">
          <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
            <button class="modal-close" onclick="document.getElementById('whatsapp-modal').remove(); if(window.InicioPage) window.InicioPage.render();">&times;</button>
          </div>
          <div class="modal-body" style="padding: 2rem;">
            <div style="margin-bottom: 1.5rem;">
              <i class="bi bi-check-circle-fill" style="font-size: 4rem; color: #00b09b;"></i>
            </div>
            <h3 style="color: #fff; margin-bottom: 1rem; font-size: 1.5rem;">
              ¡Ya estás más cerca de tener tu Graymaya!
            </h3>
            <p style="color: #a0a0a0; margin-bottom: 2rem; font-size: 1rem;">
              Tu pedido #${pedidoId} ha sido creado exitosamente
            </p>
            <a href="${whatsappURL}" target="_blank" class="btn btn-success" style="
              background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
              border: none;
              padding: 1rem 2rem;
              font-size: 1.1rem;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              gap: 0.75rem;
              text-decoration: none;
              color: white;
              font-weight: 600;
              transition: transform 0.2s ease;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <i class="bi bi-whatsapp" style="font-size: 1.5rem;"></i>
              Confirmar mi Pedido
            </a>
            <p style="color: #666; margin-top: 1.5rem; font-size: 0.9rem;">
              Al hacer clic, se abrirá WhatsApp con toda la información de tu pedido
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

// Exponer proxies globales para compatibilidad con handlers inline existentes
window.agregarAlCarrito = (id) => Cart.agregarAlCarrito(id);
window.toggleCarrito = (e) => Cart.toggleCarrito(e);
window.toggleMiCuenta = (e) => Cart.toggleMiCuenta(e);
window.cerrarPaneles = () => Cart.cerrarPaneles();
window.cambiarCantidad = (id, c) => Cart.cambiarCantidad(id, c);
window.eliminarDelCarrito = (id) => Cart.eliminarDelCarrito(id);
window.Cart = Cart;

// ========================================
// PÁGINA: Inicio (Hero + Destacados)
// ========================================
class InicioPage {
  static render() {
    const appEl = document.getElementById("app");
    if (!appEl) return;
    appEl.innerHTML = `
        <!-- Hero Carousel -->
        <div id="heroCarousel" class="carousel slide hero-carousel" data-bs-ride="carousel">
            <div class="carousel-indicators">
                <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" class="active"></button>
                <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
                <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
                <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="3"></button>
            </div>
            <div class="carousel-inner">
        <div class="carousel-item active">
          <img src="public/img/carrousel/17.png" class="carousel-img d-block w-100" alt="Colección Graymaya">
                    <div class="carousel-caption">
                        <a href="#" class="btn-comprar" data-page="graymayas">Comprar</a>
                    </div>
                </div>
        <div class="carousel-item">
          <img src="public/img/carrousel/1761136704893.png" class="carousel-img d-block w-100" alt="Nueva Colección">
                    <div class="carousel-caption">
                        <a href="#" class="btn-comprar" data-page="basicos">Comprar</a>
                    </div>
                </div>
        <div class="carousel-item">
          <img src="public/img/carrousel/6.png" class="carousel-img d-block w-100" alt="Accesorios">
                    <div class="carousel-caption">
                        <a href="#" class="btn-comprar" data-page="accesorios">Comprar</a>
                    </div>
                </div>
        <div class="carousel-item">
          <img src="public/img/carrousel/5.png" class="carousel-img d-block w-100" alt="Accesorios">
                    <div class="carousel-caption">
                        <a href="#" class="btn-comprar" data-page="colaboraciones">Comprar</a>
                    </div>
                </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
            </button>
        </div>

        <!-- Productos Destacados -->
        <section class="productos-section">
            <div class="container">
                <h2 class="section-title">Productos Destacados</h2>
                <div class="row g-4" id="productosDestacados"></div>
            </div>
        </section>
    `;

    // Cargar productos destacados (usando fallback local)
    const destacados = [
      ...productosData.graymayas.slice(0, 2),
      ...productosData.basicos.slice(0, 2),
      ...productosData.accesorios.slice(0, 2),
      ...productosData.colaboraciones.slice(0, 2),
    ];
    const container = document.getElementById("productosDestacados");
    if (container) {
      container.innerHTML = destacados
        .map((producto) => InicioPage._crearProductoCard(producto))
        .join("");
    }

    // Event listeners comprar botones del carousel
    document.querySelectorAll(".btn-comprar").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = btn.getAttribute("data-page");
        app.navigateTo(page);
      });
    });

    // Ajustar altura del carrousel en móvil después de cargar imágenes
    InicioPage.ajustarAlturaCarousel();
  }

  static ajustarAlturaCarousel() {
    // Solo aplicar en vista móvil
    if (window.innerWidth > 768) return;

    const carousel = document.getElementById("heroCarousel");
    const carouselItems = document.querySelectorAll(
      ".hero-carousel .carousel-item"
    );
    const images = document.querySelectorAll(".hero-carousel .carousel-img");

    if (!carousel || images.length === 0) return;

    // Función para ajustar altura basada en la imagen más alta
    const ajustarAltura = () => {
      let maxAspectRatio = 0;

      // Encontrar la proporción más alta de todas las imágenes
      images.forEach((img) => {
        if (img.complete && img.naturalHeight > 0) {
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          console.log(
            `Imagen: ${img.src}, natural: ${img.naturalWidth}x${img.naturalHeight}, ratio: ${aspectRatio}`
          );
          if (aspectRatio > maxAspectRatio) {
            maxAspectRatio = aspectRatio;
          }
        }
      });

      if (maxAspectRatio > 0) {
        // Calcular altura basada en el ancho actual del carousel
        const anchoCarousel = carousel.offsetWidth;
        const alturaCalculada = anchoCarousel * maxAspectRatio;

        // Usar la altura calculada directamente sin mínimos
        const alturaFinal = alturaCalculada;

        carousel.style.height = `${alturaFinal}px`;
        carousel.style.minHeight = `${alturaFinal}px`;
        carouselItems.forEach((item) => {
          item.style.height = `${alturaFinal}px`;
        });

        console.log(
          `✅ Carousel ajustado: ancho=${anchoCarousel}px, altura=${alturaFinal}px, ratio=${maxAspectRatio.toFixed(
            3
          )}`
        );
      } else {
        console.warn(
          "⚠️ No se pudo calcular aspect ratio. Imágenes aún no cargadas."
        );
      }
    };

    // Esperar un poco para asegurar que el DOM esté listo
    setTimeout(() => {
      ajustarAltura();
    }, 100);

    // Escuchar carga de cada imagen
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", () => {
          setTimeout(ajustarAltura, 50);
        });
      }
    });

    // Ajustar en resize con debounce
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth <= 768) {
          ajustarAltura();
        }
      }, 250);
    });
  }

  // Crear tarjeta de producto (compartida con catálogo; replicada aquí por agrupación lógica)
  static _crearProductoCard(producto) {
    const id = producto.producto_id ?? producto.id;
    const nombre = producto.nombre_producto ?? producto.nombre ?? "Sin nombre";
    const descripcion =
      producto.descripcion ?? producto.descripcion_producto ?? "";
    const precio = producto.precio ?? 0;
    const rawImg =
      producto.url_imagen ??
      producto.imagen ??
      "/placeholder.svg?height=300&width=300";
    const imagen = Utils.normalizeMediaUrl(rawImg);
    const stockVal = (producto.stock ?? 0) > 0;
    const isActive = producto.activo ?? true;
    const disponible = stockVal && isActive;

    // Obtener nombres desde cache si están (no obligatorio en inicio)
    const detallesHtml = `<div class="product-details"><div class="detail-item categoria">Sin categoría</div></div>`;

    return `
      <div class="col-md-4 col-lg-3">
        <div class="product-card ${!isActive ? "product-inactive" : ""}">
          <img src="${imagen}" alt="${nombre}" class="product-image">
          <div class="product-info">
            <h5 class="product-name">${nombre}</h5>
            <p class="product-description">${descripcion}</p>
            ${detallesHtml}
            <p class="product-price">$${precio}</p>
            <p class="product-stock ${
              disponible ? "stock-disponible" : "stock-agotado"
            }">
              ${!isActive ? "No Disponible" : stockVal ? "En Stock" : "Agotado"}
            </p>
            <button class="btn btn-add-cart" ${
              !disponible ? "disabled" : ""
            } onclick="agregarAlCarrito(${id})">
              ${disponible ? "Agregar al Carrito" : "No Disponible"}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// ========================================
// PÁGINA: Catálogo (todas las variantes de catálogo)
// ========================================
class CatalogoPage {
  // Textos descriptivos por categoría (definidos una sola vez)
  static textosCategoria = {
    graymayas:
      "Los productos disponibles son tal cual se ven en la imagen, los productos base siempre seran unicos y direrentes, elige un producto base y tu graymaya tendra ese estilo (colores personalizables)",
    basicos:
      "en la compra de 4 playeras basicas, se te cobraran solo 3, la cuarta va por nuestra cuenta.",
    accesorios:
      "En la compra de 3 accessorios, se te regalara un accesorio mas",
    colaboraciones:
      "en la compra de 3 prendas se te aplicara un descuento del 20%",
  };

  // render: renderiza la UI del catálogo (pestañas + productos)
  static render(categoria, titulo) {
    const app = document.getElementById("app");
    if (!app) return;

    const categorias = {
      graymayas: [
        { id: "todos", nombre: "Todos" },
        { id: "sudaderas-cierre", nombre: "Sudaderas con Cierre" },
        { id: "sudaderas-cerradas", nombre: "Sudaderas Cerradas" },
        { id: "playeras", nombre: "Playeras" },
      ],
      basicos: [
        { id: "todos", nombre: "Todos" },
        { id: "sudaderas-cierre", nombre: "Sudaderas con Cierre" },
        { id: "sudaderas-cerradas", nombre: "Sudaderas Cerradas" },
        { id: "playeras", nombre: "Playeras" },
      ],
      accesorios: [
        { id: "todos", nombre: "Todos" },
        { id: "collares", nombre: "Collares" },
        { id: "pulseras", nombre: "Pulseras" },
        { id: "aretes", nombre: "Aretes" },
      ],
      colaboraciones: [
        { id: "todos", nombre: "Todos" },
        { id: "playeras", nombre: "Playeras" },
        { id: "sudaderas", nombre: "Sudaderas" },
      ],
    };

    // Mapeo de imágenes por categoría
    const imagenesCategoria = {
      graymayas: "public/img/carrousel/1.png",
      basicos: "public/img/carrousel/3.png",
      accesorios: "public/img/carrousel/4.png",
      colaboraciones: "public/img/carrousel/2.png",
    };

    const imagenActual =
      imagenesCategoria[categoria] || "public/img/carrousel/1.png";

    app.innerHTML = `
        <!-- Sección de Información -->
        <section class="info-section">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h1 class="info-title">${titulo}</h1>
                        <p class="info-text">
                            Descubre nuestra colección exclusiva de ${titulo.toLowerCase()}. 
                            Viste con estilo y regala una prenda con nuestro programa.
                        </p>
                        <p class="info-text">
                            Somos una empresa con causa, con el programa GRAYMAYA PARA TODOS
                            ayudas luciendo increíble. 
                            Por cada graymaya o paquete de basicas que compres, se le regalara una prenda a alguien que lo necesite. 
                        </p>

                    </div>
                    <div class="col-md-6">
                        <img src="${imagenActual}" alt="${titulo}" class="img-fluid rounded">
                    </div>
                </div>
            </div>
        </section>

        <!-- Catálogo -->
        <section class="catalogo-section">
            <div class="container">
                <!-- Filtros -->
                <div class="filtros-container">
                    <div class="categoria-tabs">
                        <ul class="nav nav-pills">
                            ${categorias[categoria]
                              .map(
                                (cat, index) => `
                                <li class="nav-item">
                                    <a class="nav-link ${
                                      index === 0 ? "active" : ""
                                    }" 
                                       href="#" 
                                       data-categoria="${cat.id}">
                                        ${cat.nombre}
                                    </a>
                                </li>
                            `
                              )
                              .join("")}
                        </ul>
                    </div>
                    <div class="filtros-adicionales">
                        <button class="btn btn-primary-custom" onclick="CatalogoPage.mostrarInfoPersonalizada()">
                            <i class="bi bi-palette"></i> Personalizada
                        </button>
                    </div>
                </div>

                <!-- Productos -->
                <div class="row g-4" id="productos${categoria}"></div>
            </div>
        </section>
    `;

    // Cargar productos
    CatalogoPage.cargarProductosPorCategoria(
      categoria,
      `productos${categoria}`
    );

    // Event listeners de las pestañas
    document.querySelectorAll(".categoria-tabs .nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".categoria-tabs .nav-link")
          .forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        const categoriaFiltro = link.getAttribute("data-categoria");
        CatalogoPage.filtrarProductos(
          categoria,
          categoriaFiltro,
          `productos${categoria}`
        );
      });
    });
  }

  // crearProductoCard: reutilizable por catálogo (más completa que la del inicio)
  static crearProductoCard(producto) {
    const id = producto.producto_id ?? producto.id;
    const nombre = producto.nombre_producto ?? producto.nombre ?? "Sin nombre";
    const descripcion =
      producto.descripcion ?? producto.descripcion_producto ?? "";
    const precio = producto.precio ?? 0;
    const rawImg =
      producto.url_imagen ??
      producto.imagen ??
      "/placeholder.svg?height=300&width=300";
    const imagen = Utils.normalizeMediaUrl(rawImg);
    const stockVal = (producto.stock ?? 0) > 0;
    const isActive = producto.activo ?? true;
    const disponible = stockVal && isActive;

    // Resolver referencias desde cache
    const getVal = (obj, keys) => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return null;
    };

    const categoria_id =
      getVal(producto, ["categoria_id", "categoria"]) || null;
    const patron_id = getVal(producto, ["patron_id", "patron"]) || null;

    const catObj =
      cache.categorias.find((c) => c.categoria_id === categoria_id) ||
      cache.categorias.find((c) => c.categoria_id === producto.categoria) ||
      {};
    const categoriaName =
      catObj.nombre ?? catObj.nombre_categoria ?? "Sin categoría";

    const patronObj =
      cache.patrones.find((pt) => pt.patron_id === patron_id) || {};
    const patronName =
      patronObj.nombre ??
      patronObj.nombre_patron ??
      patronObj.codigo_patron ??
      "";

    const detalles = [];
    detalles.push(
      `<div class="detail-item categoria">${Utils.escapeHtml(
        categoriaName
      )}</div>`
    );
    if (patronName)
      detalles.push(
        `<div class="detail-item patron">Patrón: ${Utils.escapeHtml(
          patronName
        )}</div>`
      );
    const detallesHtml = detalles.length
      ? `<div class="product-details">${detalles.join("")}</div>`
      : "";

    return `
      <div class="col-md-4 col-lg-3">
        <div class="product-card ${!isActive ? "product-inactive" : ""}">
          <img src="${imagen}" alt="${nombre}" class="product-image">
          <div class="product-info">
            <h5 class="product-name">${nombre}</h5>
            <p class="product-description">${descripcion}</p>
            ${detallesHtml}
            <p class="product-price">$${precio}</p>
            <p class="product-stock ${
              disponible ? "stock-disponible" : "stock-agotado"
            }">
              ${!isActive ? "No Disponible" : stockVal ? "En Stock" : "Agotado"}
            </p>
            <button class="btn btn-add-cart" ${
              !disponible ? "disabled" : ""
            } onclick="agregarAlCarrito(${id})">
              ${disponible ? "Agregar al Carrito" : "No Disponible"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // cargarProductosPorCategoria: obtiene productos desde API y renderiza; fallback a datos locales
  static cargarProductosPorCategoria(categoria, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const textoActual =
      CatalogoPage.textosCategoria[categoria] ||
      "Explora nuestra colección exclusiva.";

    // Cargar referencias (no bloquear)
    References.loadReferences().catch(() => {});

    API.fetch("/productos?limit=200")
      .then((res) => {
        const items = res.items || [];
        window.productosCache = items;

        const allowedIds = MENU_CATEGORY_MAP[categoria] || null;
        let productos = items;

        if (allowedIds && allowedIds.length) {
          productos = items.filter((p) => {
            const pid = p.categoria_id ?? p.categoria ?? null;
            if (pid === null || pid === undefined) return false;
            return allowedIds.includes(Number(pid));
          });
        }

        if (!productos.length) productos = items;

        // Agregar texto descriptivo antes de las tarjetas
        const textoDescriptivo = `
          <div class="col-12 mb-4">
            <div class="catalogo-text-panel">
              <p class="catalogo-text">${textoActual}</p>
            </div>
          </div>
        `;

        container.innerHTML =
          textoDescriptivo +
          productos
            .map((producto) => CatalogoPage.crearProductoCard(producto))
            .join("");
      })
      .catch((err) => {
        console.error("Error cargando productos:", err.message);
        const productos = productosData[categoria] || [];

        // Agregar texto descriptivo antes de las tarjetas (fallback)
        const textoDescriptivo = `
          <div class="col-12 mb-4">
            <div class="catalogo-text-panel">
              <p class="catalogo-text">${textoActual}</p>
            </div>
          </div>
        `;

        container.innerHTML =
          textoDescriptivo +
          productos
            .map((producto) => CatalogoPage.crearProductoCard(producto))
            .join("");
      });
  }

  // filtrarProductos: filtra items en cache según filtros y renderiza
  static filtrarProductos(categoria, filtro, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = window.productosCache || [];

    const textoActual =
      CatalogoPage.textosCategoria[categoria] ||
      "Explora nuestra colección exclusiva.";

    const allowedIds = MENU_CATEGORY_MAP[categoria] || null;
    let productos = items.filter((p) => {
      const pid = p.categoria_id ?? p.categoria ?? null;
      if (pid === null || pid === undefined) return false;
      if (allowedIds && allowedIds.length) {
        return allowedIds.includes(Number(pid));
      }
      return true;
    });

    if (filtro && filtro !== "todos") {
      productos = productos.filter((p) => {
        // Obtener la categoría del producto desde cache
        const pid = p.categoria_id ?? p.categoria ?? null;
        if (pid === null || pid === undefined) return false;

        const cat = cache.categorias.find(
          (c) => c.categoria_id === Number(pid)
        );

        if (!cat) return false;

        const catNombre = (
          cat.nombre ??
          cat.nombre_categoria ??
          ""
        ).toLowerCase();
        const filtroLower = filtro.toLowerCase();

        // Mapeo de filtros a palabras clave en nombres de categorías
        // Para Graymayas y Básicos
        if (filtroLower.includes("sudaderas-cierre")) {
          return catNombre.includes("sudadera") && catNombre.includes("cierre");
        }
        if (
          filtroLower.includes("sudaderas-cerradas") ||
          filtroLower.includes("sudaderas")
        ) {
          return (
            catNombre.includes("sudadera") &&
            (catNombre.includes("cerrada") ||
              catNombre.includes("pullover") ||
              !catNombre.includes("cierre"))
          );
        }
        if (filtroLower.includes("playeras")) {
          return (
            catNombre.includes("playera") ||
            catNombre.includes("camiseta") ||
            catNombre.includes("t-shirt")
          );
        }

        // Para Accesorios
        if (filtroLower.includes("collares")) {
          return catNombre.includes("collar");
        }
        if (filtroLower.includes("pulseras")) {
          return catNombre.includes("pulsera");
        }
        if (filtroLower.includes("aretes")) {
          return catNombre.includes("arete") || catNombre.includes("pendiente");
        }

        // Fallback: comparación por slug
        const catSlug = Utils.slugify(catNombre);
        return catSlug === filtroLower || catSlug.includes(filtroLower);
      });
    }

    // Crear texto descriptivo
    const textoDescriptivo = `
      <div class="col-12 mb-4">
        <div class="catalogo-text-panel">
          <p class="catalogo-text">${textoActual}</p>
        </div>
      </div>
    `;

    if (!productos.length) {
      container.innerHTML =
        textoDescriptivo +
        `
        <div class="col-12">
          <div class="alert alert-info text-center">
            <i class="bi bi-info-circle"></i>
            No se encontraron productos con este filtro
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML =
      textoDescriptivo +
      productos
        .map((producto) => CatalogoPage.crearProductoCard(producto))
        .join("");
  }

  // Mostrar modal informativo para pedidos personalizados
  static mostrarInfoPersonalizada() {
    // Verificar si el modal ya existe
    let modalPersonalizada = document.getElementById(
      "info-personalizada-modal"
    );
    if (modalPersonalizada) {
      modalPersonalizada.remove();
    }

    const modalHTML = `
      <div class="modal-overlay" id="info-personalizada-modal" style="z-index: 10000;">
        <div class="modal-content" style="max-width: 550px; text-align: center;">
          <div class="modal-header" style="border-bottom: none; padding-bottom: 0; justify-content: flex-end;">
            <button class="modal-close" onclick="document.getElementById('info-personalizada-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 2rem 2.5rem;">
            <div style="margin-bottom: 2rem;">
              <img src="public/img/icons/tarjetaIco.png" alt="Graymaya" style="height: 80px; width: auto;">
            </div>
            <h3 style="color: #fff; margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 600;">
              Pedidos Personalizados
            </h3>
            <p style="color: #e0e0e0; margin-bottom: 1rem; font-size: 1rem; line-height: 1.8; text-align: left;">
              Si quieres un diseño más personalizado, elige el producto del catálogo que más se parezca a tu idea.
            </p>
            <p style="color: #e0e0e0; margin-bottom: 1rem; font-size: 1rem; line-height: 1.8; text-align: left;">
              En el carrito, abajo del subtotal escribe <strong style="color: #00b09b;">"PERSONALIZADA"</strong> y en cuanto confirmes tu pedido nuestro equipo se pondrá en contacto para los detalles.
            </p>
            <p style="color: #e0e0e0; margin-bottom: 2rem; font-size: 1rem; line-height: 1.8; text-align: left;">
              Estamos seguros que te quedará increíble.
            </p>
            <button class="btn btn-primary-custom" onclick="document.getElementById('info-personalizada-modal').remove()" style="
              padding: 0.75rem 2rem;
              font-size: 1rem;
              border-radius: 8px;
              font-weight: 600;
            ">
              Entendido
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }
}

// Exponer CatalogoPage globalmente para compatibilidad con onclick inline
window.CatalogoPage = CatalogoPage;

// ========================================

// ========================================
// PÁGINA: Panel de Control (y sus módulos administrativos)
// - Este bloque agrupa TODO lo relacionado con el panel: UI y submódulos
// ========================================
class PanelControlPage {
  static render() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="d-flex">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h4>Panel de Control</h4>
                </div>
                <ul class="sidebar-menu">
                    <li class="sidebar-item active">
                        <a href="#" data-section="dashboard">
                            <i class="bi bi-speedometer2"></i>
                            Dashboard
                        </a>
                    </li>
                    <li class="sidebar-item">
                        <a href="#" data-section="inventario">
                            <i class="bi bi-box-seam"></i>
                            Inventario
                        </a>
                    </li>
                    <li class="sidebar-item">
                        <a href="#" data-section="clientes">
                            <i class="bi bi-people"></i>
                            Clientes
                        </a>
                    </li>
                    <li class="sidebar-item">
                        <a href="#" data-section="colaboradores">
                            <i class="bi bi-person-badge"></i>
                            Colaboradores
                        </a>
                    </li>
          <li class="sidebar-item">
            <a href="#" data-section="productos">
              <i class="bi bi-box-seam"></i>
              Productos
            </a>
          </li>
                    <li class="sidebar-item">
                        <a href="#" data-section="pedidos">
                            <i class="bi bi-truck"></i>
                            Pedidos
                        </a>
                    </li>
                </ul>
                <div class="sidebar-footer">
                    <a href="#" class="btn btn-primary-custom w-100" data-page="inicio">
                        <i class="bi bi-arrow-left"></i> Volver a la Tienda
                    </a>
                </div>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <!-- Dashboard -->
                <div class="content-section active" id="dashboard">
                    <h2 class="mb-4">Dashboard</h2>
                    <div class="row g-4 mb-4">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-primary">
                                    <i class="bi bi-cart"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>156</h3>
                                    <p>Ventas Totales</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-success">
                                    <i class="bi bi-currency-dollar"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>$45,890</h3>
                                    <p>Ingresos</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-warning">
                                    <i class="bi bi-box"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>89</h3>
                                    <p>Productos</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-icon bg-info">
                                    <i class="bi bi-people"></i>
                                </div>
                                <div class="stat-info">
                                    <h3>234</h3>
                                    <p>Clientes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Otras secciones -->
                <div class="content-section" id="inventario">
          <h2 class="mb-4">Inventario</h2>
          <div class="admin-card" id="inventario-admin-card">
            <div class="text-muted">Cargando módulo de inventario...</div>
          </div>
                </div>

                <div class="content-section" id="clientes">
                    <h2 class="mb-4">Clientes</h2>
                    <div class="admin-card">
                        <p>Base de datos de clientes</p>
                    </div>
                </div>

                <div class="content-section" id="colaboradores">
                    <h2 class="mb-4">Colaboradores</h2>
                    <div class="admin-card">
                        <p>Gestión de colaboraciones</p>
                    </div>
                </div>

        <div class="content-section" id="productos">
          <div class="admin-section">
            <div class="admin-header">
              <h3>Gestión de Productos</h3>
              <button id="btnCrearProducto" class="btn btn-primary-custom">
                <i class="bi bi-plus-circle"></i> Nuevo Producto
              </button>
            </div>
            <div class="table-responsive">
              <div id="productosAdminContainer">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th class="col-min text-center" style="max-width:60px;">ID</th>
                      <th class="col-img text-center" style="max-width:80px;">Imagen</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th class="col-min text-center" style="max-width:80px;">Precio</th>
                      <th class="col-min text-center" style="max-width:60px;">Stock</th>
                      <th>Categoría</th>
                      <th class="col-min text-center" style="max-width:80px;">Talla</th>
                      <th>Color</th>
                      <th>Género</th>
                      <th>Tipo Prenda</th>
                      <th class="col-min text-center" style="max-width:80px;">Patrón</th>
                      <th class="col-min text-center" style="max-width:80px;">Es Colaboración</th>
                      <th>Colaborador</th>
                      <th>Detalle Colab.</th>
                      <th>Sudadera Tipo</th>
                      <th class="col-min text-center" style="max-width:100px;">Fecha Creación</th>
                      <th class="col-min text-center" style="max-width:60px;">Activo</th>
                      <th class="col-actions text-center" style="width:110px;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="productosAdminTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

                <div class="content-section" id="pedidos">
                    <div id="admin-pedidos-content">
                        <h2 class="mb-4">Pedidos</h2>
                        <div class="admin-card">
                            <p>Cargando...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Sidebar navigation logic (se mantiene igual en comportamiento)
    document.querySelectorAll(".sidebar-item a").forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        document
          .querySelectorAll(".sidebar-item")
          .forEach((i) => i.classList.remove("active"));
        this.parentElement.classList.add("active");

        document
          .querySelectorAll(".content-section")
          .forEach((section) => section.classList.remove("active"));

        const sectionId = this.getAttribute("data-section");
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add("active");
          // Inicializar módulos según sección
          if (sectionId === "productos") {
            References.loadReferences()
              .then(() => ProductsAdmin.loadAdminProductos())
              .then(() => References.renderReferenceTables())
              .catch(() => {});
          } else if (sectionId === "inventario") {
            References.loadReferences()
              .then(() => InventarioAdmin.render())
              .catch((err) => console.error("Inventario error:", err));
          } else if (sectionId === "colaboradores") {
            ColaboradoresAdmin.renderTable().catch(() => {});
          } else if (sectionId === "clientes") {
            ClientesAdmin.renderTable().catch(() => {});
          } else if (sectionId === "pedidos") {
            // Cargar referencias primero, luego la tabla de pedidos
            References.loadReferences()
              .then(() => PedidosAdmin.renderTable())
              .catch((err) => {
                console.error("Error al cargar pedidos:", err);
              });
          } else {
            // limpiar contenedores auxiliares si existen
            const refContainer = document.getElementById(
              "reference-tables-container"
            );
            if (refContainer && refContainer.parentNode)
              refContainer.parentNode.removeChild(refContainer);
            const colContainer = document.getElementById(
              "colaboradores-table-container"
            );
            if (colContainer && colContainer.parentNode)
              colContainer.parentNode.removeChild(colContainer);
          }
        }
      });
    });

    // Listener volver a tienda
    const volverBtn = document.querySelector('[data-page="inicio"]');
    if (volverBtn) {
      volverBtn.addEventListener("click", (e) => {
        e.preventDefault();
        app.navigateTo("inicio");
      });
    }

    // Inicializar panel de productos: cargar referencias y tabla
    References.loadReferences()
      .then(() => ProductsAdmin.loadAdminProductos())
      .catch(() => {});

    const btnCrear = document.getElementById("btnCrearProducto");
    if (btnCrear) {
      btnCrear.addEventListener("click", (e) => {
        e.preventDefault();
        ProductsAdmin.openProductForm();
      });
    }
  }
}

// ========================================
// SUBMODULO: References (categorias/tallas/patrones/colaboradores)
// - Se mantiene agrupado y reutilizable por otros módulos.
// ========================================
class References {
  // Cargar referencias principales y almacenarlas en cache
  static async loadReferences() {
    try {
      const [cats, tallas, patrones, cols, prods] = await Promise.all([
        API.fetch("/categorias?limit=200"),
        API.fetch("/tallas?limit=200"),
        API.fetch("/patrones?limit=200"),
        API.fetch("/colaboradores?limit=200"),
        API.fetch("/productos?limit=200"),
      ]);
      cache.categorias = cats.items || [];
      cache.tallas = tallas.items || [];
      cache.patrones = patrones.items || [];
      cache.colaboradores = cols.items || [];
      cache.productos = prods.items || [];
    } catch (err) {
      console.warn(
        "No se pudieron cargar referencias desde la API:",
        err.message
      );
    }
  }

  // Renderiza las 3 tablas (tallas/patrones/categorias) y las inserta en el panel productos
  static async renderReferenceTables() {
    const existing = document.getElementById("reference-tables-container");
    if (existing) {
      await References.refreshAllReferenceTables();
      return;
    }

    const firstTable = document.querySelector("table");
    const container = document.createElement("div");
    container.id = "reference-tables-container";
    container.style.marginTop = "24px";

    const resources = [
      { key: "tallas", title: "Tallas" },
      { key: "patrones", title: "Patrones" },
      { key: "categorias", title: "Categorías" },
    ];

    for (const r of resources) {
      const section = document.createElement("section");
      section.className = "admin-section";
      section.style.marginBottom = "18px";

      const header = document.createElement("div");
      header.className = "admin-header";

      const h = document.createElement("h3");
      h.textContent = r.title;
      header.appendChild(h);

      const addBtn = document.createElement("button");
      addBtn.className = "btn btn-primary-custom";
      addBtn.innerHTML = `<i class="bi bi-plus-circle"></i> Añadir ${r.title.slice(
        0,
        -1
      )}`;
      addBtn.addEventListener("click", () =>
        References.showCreateEditForm(r.key)
      );
      header.appendChild(addBtn);
      section.appendChild(header);

      const tableWrapper = document.createElement("div");
      tableWrapper.className = "table-responsive";
      tableWrapper.id = `${r.key}AdminContainer`;

      const table = document.createElement("table");
      table.className = "admin-table reference-table";
      table.dataset.resource = r.key;
      tableWrapper.appendChild(table);
      section.appendChild(tableWrapper);
      container.appendChild(section);
    }

    const productosAdminContainer = document.getElementById(
      "productosAdminContainer"
    );
    if (productosAdminContainer && productosAdminContainer.parentNode) {
      productosAdminContainer.parentNode.insertBefore(
        container,
        productosAdminContainer.nextSibling
      );
    } else {
      return;
    }

    await References.refreshAllReferenceTables();
  }

  static async refreshAllReferenceTables() {
    await References.refreshReferenceTable("tallas");
    await References.refreshReferenceTable("patrones");
    await References.refreshReferenceTable("categorias");
  }

  static async refreshReferenceTable(resource) {
    const table = document.querySelector(
      `table.reference-table[data-resource="${resource}"]`
    );
    if (!table) return;

    let items = [];
    try {
      items = await API.fetchReference(resource);
    } catch (err) {
      console.error(`Error cargando ${resource}:`, err);
      table.innerHTML = `<thead><tr><th>Error</th></tr></thead><tbody><tr><td>Imposible cargar datos</td></tr></tbody>`;
      return;
    }

    if (resource === "tallas") cache.tallas = items;
    if (resource === "patrones") cache.patrones = items;
    if (resource === "categorias") cache.categorias = items;

    let theadHtml = "";
    let rowsHtml = "";

    if (resource === "tallas") {
      theadHtml = `<tr><th class="col-min text-center" style="max-width:60px;">ID</th><th>Nombre</th><th class="col-actions text-center" style="width:110px;">Acciones</th></tr>`;
      rowsHtml = items
        .map(
          (it) => `
        <tr data-id="${it.talla_id}">
          <td class="col-min text-center">${it.talla_id}</td>
          <td>${Utils.escapeHtml(it.nombre_talla)}</td>
          <td class="col-actions text-center">
            <button class="btn btn-warning btn-sm edit-ref" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm del-ref" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
        )
        .join("");
    } else if (resource === "patrones") {
      theadHtml = `<tr><th class="col-min text-center" style="max-width:60px;">ID</th><th>Código</th><th>Nombre</th><th>Descripción</th><th class="col-actions text-center" style="width:110px;">Acciones</th></tr>`;
      rowsHtml = items
        .map(
          (it) => `
        <tr data-id="${it.patron_id}">
          <td class="col-min text-center">${it.patron_id}</td>
          <td>${Utils.escapeHtml(it.codigo_patron)}</td>
          <td>${Utils.escapeHtml(it.nombre_patron)}</td>
          <td>${Utils.escapeHtml(it.descripcion || "")}</td>
          <td class="col-actions text-center">
            <button class="btn btn-warning btn-sm edit-ref" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm del-ref" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
        )
        .join("");
    } else if (resource === "categorias") {
      theadHtml = `<tr><th class="col-min text-center" style="max-width:60px;">ID</th><th>Nombre</th><th>Descripción</th><th class="col-actions text-center" style="width:110px;">Acciones</th></tr>`;
      rowsHtml = items
        .map(
          (it) => `
        <tr data-id="${it.categoria_id}">
          <td class="col-min text-center">${it.categoria_id}</td>
          <td>${Utils.escapeHtml(it.nombre)}</td>
          <td>${Utils.escapeHtml(it.descripcion || "")}</td>
          <td class="col-actions text-center">
            <button class="btn btn-warning btn-sm edit-ref" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm del-ref" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
        )
        .join("");
    }

    table.innerHTML = `<thead>${theadHtml}</thead><tbody>${rowsHtml}</tbody>`;

    table.querySelectorAll(".edit-ref").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = References.getRowIdFromButton(e.target, resource);
        const item = References.findCachedItem(resource, id);
        References.showCreateEditForm(resource, item);
      });
    });
    table.querySelectorAll(".del-ref").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = References.getRowIdFromButton(e.target, resource);
        if (!confirm("¿Eliminar elemento id=" + id + "?")) return;
        try {
          await API.deleteReference(resource, id);
          await References.refreshReferenceTable(resource);
          notificaciones("Eliminado");
        } catch (err) {
          notificaciones("Error eliminando: " + (err.message || err), "error");
        }
      });
    });
  }

  static getRowIdFromButton(btn, resource) {
    const tr = btn.closest("tr");
    if (!tr) return null;
    const dataId = tr.dataset.id;
    return dataId ? parseInt(dataId) : null;
  }

  static findCachedItem(resource, id) {
    const arr =
      resource === "tallas"
        ? cache.tallas
        : resource === "patrones"
        ? cache.patrones
        : cache.categorias;
    if (!arr) return null;
    const key =
      resource === "tallas"
        ? "talla_id"
        : resource === "patrones"
        ? "patron_id"
        : "categoria_id";
    return arr.find((x) => x[key] === parseInt(id)) || null;
  }

  // Modal reutilizable para create/edit de referencias (tallas/patrones/categorias/colaboradores)
  static async showCreateEditForm(resource, item = null) {
    let modalEl = document.getElementById("referenceModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "referenceModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content modal-dark">
          <div class="modal-header">
            <h5 class="modal-title">Referencia</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="referenceForm">
              <input type="hidden" id="ref_resource">
              <input type="hidden" id="ref_id">

              <div class="mb-3" id="field_codigo_patron" style="display:none">
                <label class="form-label">Código</label>
                <input id="ref_codigo" class="form-control form-control-dark" maxlength="10">
              </div>

              <div class="mb-3" id="field_nombre">
                <label class="form-label">Nombre</label>
                <input id="ref_nombre" class="form-control form-control-dark" maxlength="50" required>
              </div>

              <div class="mb-3" id="field_descripcion" style="display:none">
                <label class="form-label">Descripción</label>
                <textarea id="ref_descripcion" class="form-control form-control-dark" rows="3" maxlength="255"></textarea>
              </div>

              <div class="mb-3" id="field_contacto" style="display:none">
                <label class="form-label">Contacto</label>
                <input id="ref_contacto" class="form-control form-control-dark" maxlength="100">
              </div>

              <div class="mb-3" id="field_detalle_acuerdo" style="display:none">
                <label class="form-label">Detalle Acuerdo</label>
                <textarea id="ref_detalle_acuerdo" class="form-control form-control-dark" rows="2" maxlength="255"></textarea>
              </div>

              <div class="text-end">
                <button type="submit" class="btn btn-primary-custom">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(modalEl);

      const form = modalEl.querySelector("#referenceForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const resType = document.getElementById("ref_resource").value;
        const id = document.getElementById("ref_id").value || null;
        const nombre = document.getElementById("ref_nombre").value.trim();
        const descripcion = document
          .getElementById("ref_descripcion")
          .value.trim();
        const contacto = document.getElementById("ref_contacto").value.trim();
        const detalle_acuerdo = document
          .getElementById("ref_detalle_acuerdo")
          .value.trim();
        const codigo = document.getElementById("ref_codigo").value.trim();

        try {
          let payload = {};
          if (resType === "tallas") {
            if (!nombre) return alert("El nombre de la talla es requerido");
            payload = { nombre_talla: nombre };
          } else if (resType === "patrones") {
            if (!codigo) return alert("El código del patrón es requerido");
            if (!nombre) return alert("El nombre del patrón es requerido");
            payload = {
              codigo_patron: codigo,
              nombre_patron: nombre,
              descripcion: descripcion || null,
            };
          } else if (resType === "categorias") {
            if (!nombre) return alert("El nombre de la categoría es requerido");
            payload = { nombre: nombre, descripcion: descripcion || null };
          } else if (resType === "colaboradores") {
            if (!nombre) return alert("El nombre del colaborador es requerido");
            payload = {
              nombre: nombre,
              contacto: contacto || null,
              detalle_acuerdo: detalle_acuerdo || null,
            };
          }

          if (id) {
            await API.updateReference(resType, id, payload);
          } else {
            await API.createReference(resType, payload);
          }

          const bs = bootstrap.Modal.getInstance(modalEl);
          if (bs) bs.hide();

          if (resType === "colaboradores") {
            await ColaboradoresAdmin.refreshTable();
          } else {
            await References.refreshReferenceTable(resType);
          }
          try {
            await References.loadReferences();
          } catch (e) {
            /* ignore */
          }
        } catch (err) {
          alert("Error guardando: " + (err.message || err));
        }
      });
    }

    document.getElementById("ref_resource").value = resource;
    document.getElementById("ref_id").value = item
      ? item.talla_id ||
        item.patron_id ||
        item.categoria_id ||
        item.colaborador_id
      : "";

    document.getElementById("ref_codigo").value = "";
    document.getElementById("ref_nombre").value = "";
    document.getElementById("ref_descripcion").value = "";
    document.getElementById("ref_contacto").value = "";
    document.getElementById("ref_detalle_acuerdo").value = "";

    document.getElementById("field_codigo_patron").style.display =
      resource === "patrones" ? "block" : "none";
    document.getElementById("field_descripcion").style.display =
      resource === "patrones" || resource === "categorias" ? "block" : "none";
    document.getElementById("field_contacto").style.display =
      resource === "colaboradores" ? "block" : "none";
    document.getElementById("field_detalle_acuerdo").style.display =
      resource === "colaboradores" ? "block" : "none";

    if (item) {
      if (resource === "tallas") {
        document.getElementById("ref_nombre").value =
          item.nombre_talla || item.nombre || "";
      } else if (resource === "patrones") {
        document.getElementById("ref_codigo").value = item.codigo_patron || "";
        document.getElementById("ref_nombre").value =
          item.nombre_patron || item.nombre || "";
        document.getElementById("ref_descripcion").value =
          item.descripcion || "";
      } else if (resource === "categorias") {
        document.getElementById("ref_nombre").value = item.nombre || "";
        document.getElementById("ref_descripcion").value =
          item.descripcion || "";
      } else if (resource === "colaboradores") {
        document.getElementById("ref_nombre").value = item.nombre || "";
        document.getElementById("ref_contacto").value = item.contacto || "";
        document.getElementById("ref_detalle_acuerdo").value =
          item.detalle_acuerdo || "";
      }
    }

    const modal = new bootstrap.Modal(
      document.getElementById("referenceModal")
    );
    modal.show();
  }
}

// ========================================
// SUBMODULO: Productos (CRUD admin)
// - Agrupa todo el código relacionado a productos en el panel de control
// ========================================
class ProductsAdmin {
  static async loadAdminProductos() {
    try {
      const res = await API.fetch("/productos?limit=200");
      const items = res.items || [];
      window.productosCache = items;
      ProductsAdmin.renderProductsTable(items);
    } catch (err) {
      console.error("No se pudieron cargar productos para admin:", err.message);
      const tbody = document.getElementById("productosAdminTableBody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="8">Error cargando productos: ${err.message}</td></tr>`;
    }
  }

  static renderProductsTable(items) {
    const tbody = document.getElementById("productosAdminTableBody");
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="19" class="text-center">No hay productos registrados</td></tr>`;
      return;
    }
    const rows = items.map((p) => {
      const id = p.producto_id ?? p.id ?? "";
      const nombre = p.nombre_producto ?? p.nombre ?? "";
      const descripcion = p.descripcion ?? "";
      const precio = p.precio ?? 0;
      const stock = p.stock ?? 0;
      const rawUrl = p.url_imagen ?? p.url ?? p.imagen ?? "";
      const url_imagen = rawUrl ? Utils.normalizeMediaUrl(rawUrl) : "";

      const getVal = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return null;
      };

      const categoria_id = getVal(p, ["categoria_id", "categoria"]) || null;
      const talla_id = getVal(p, ["talla_id", "talla"]) || null;
      const patron_id = getVal(p, ["patron_id", "patron"]) || null;
      const colaborador_id =
        getVal(p, ["colaborador_id", "colaborador"]) || null;

      const catObj =
        cache.categorias.find((c) => c.categoria_id === categoria_id) || {};
      const categoriaName =
        catObj.nombre ?? catObj.nombre_categoria ?? categoria_id ?? "";

      const tallaObj = cache.tallas.find((t) => t.talla_id === talla_id) || {};
      const tallaName =
        tallaObj.nombre ??
        tallaObj.nombre_talla ??
        tallaObj.label ??
        talla_id ??
        "";

      const patronObj =
        cache.patrones.find((pt) => pt.patron_id === patron_id) || {};
      const patronName =
        patronObj.nombre ??
        patronObj.nombre_patron ??
        patronObj.codigo_patron ??
        patron_id ??
        "";

      const colaboradorObj =
        cache.colaboradores.find(
          (co) => co.colaborador_id === colaborador_id
        ) || {};
      const colaboradorName =
        colaboradorObj.nombre ??
        colaboradorObj.nombre_colaborador ??
        colaborador_id ??
        "";

      const color = p.color ?? "";
      const genero = p.genero ?? "";
      const tipo_prenda = p.tipo_prenda ?? "";
      const es_colaboracion = p.es_colaboracion ? "Sí" : "No";
      const detalle_colaboracion = p.detalle_colaboracion ?? "";
      const sudadera_tipo = p.sudadera_tipo ?? "";
      const fecha_creacion = p.fecha_creacion
        ? new Date(p.fecha_creacion).toLocaleString()
        : "";
      const activo = p.activo === false ? "No" : "Sí";

      return `
      <tr>
        <td class="col-min text-center">${id}</td>
        <td class="col-img text-center">${
          url_imagen
            ? `<img src="${url_imagen}" alt="img-${id}" style="max-width:60px;max-height:60px;object-fit:cover">`
            : "-"
        }</td>
        <td>${Utils.escapeHtml(nombre)}</td>
        <td>${Utils.escapeHtml(descripcion)}</td>
        <td class="col-min text-center">$${precio}</td>
        <td class="col-min text-center">${stock}</td>
        <td>${Utils.escapeHtml(categoriaName)}</td>
        <td class="col-min text-center">${Utils.escapeHtml(tallaName)}</td>
        <td>${Utils.escapeHtml(color)}</td>
        <td>${Utils.escapeHtml(genero)}</td>
        <td>${Utils.escapeHtml(tipo_prenda)}</td>
        <td class="col-min text-center">${Utils.escapeHtml(patronName)}</td>
        <td class="col-min text-center">${Utils.escapeHtml(
          es_colaboracion
        )}</td>
        <td>${Utils.escapeHtml(colaboradorName)}</td>
        <td>${Utils.escapeHtml(detalle_colaboracion)}</td>
        <td>${Utils.escapeHtml(sudadera_tipo)}</td>
        <td class="col-min text-center">${Utils.escapeHtml(fecha_creacion)}</td>
        <td class="col-min text-center">${Utils.escapeHtml(activo)}</td>
        <td class="col-actions text-center">
          <button class="btn btn-warning btn-sm" onclick="openProductForm(${id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${id})" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = rows.join("");
  }

  static async openProductForm(productoId = null) {
    // Buscar producto en cache si id proporcionado
    const producto = productoId
      ? (window.productosCache || []).find((p) => p.producto_id === productoId)
      : null;

    try {
      await References.loadReferences();
    } catch (e) {
      console.warn(
        "Warning: no se pudieron cargar referencias antes del formulario:",
        e.message
      );
    }

    let modalEl = document.getElementById("productoModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "productoModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content modal-dark">
          <div class="modal-header">
            <h5 class="modal-title">Producto</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="productoForm">
              <input type="hidden" id="producto_id">
              <div class="mb-3">
                <label class="form-label">Nombre</label>
                <input id="nombre_producto" class="form-control form-control-dark" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea id="descripcion" class="form-control form-control-dark" rows="3"></textarea>
              </div>
              <div class="row g-2">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Precio</label>
                  <input id="precio" type="number" step="0.01" class="form-control form-control-dark" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Stock</label>
                  <input id="stock" type="number" class="form-control form-control-dark" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">URL Imagen</label>
                  <input id="url_imagen" class="form-control form-control-dark">
                </div>
              </div>
              <div class="row g-2">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Categoría</label>
                  <select id="categoria_id" class="form-control form-control-dark" required></select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Talla</label>
                  <select id="talla_id" class="form-control form-control-dark"></select>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Color</label>
                  <input id="color" class="form-control form-control-dark" maxlength="50">
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Género</label>
                  <select id="genero" class="form-control form-control-dark">
                    <option value="">N/A</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Tipo Prenda</label>
                  <select id="tipo_prenda" class="form-control form-control-dark">
                    <option value="">N/A</option>
                    <option value="BASICA">Básica</option>
                    <option value="ESTAMPADA">Estampada</option>
                    <option value="TIEDYE">Tie-dye</option>
                  </select>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Patrón</label>
                  <select id="patron_id" class="form-control form-control-dark"></select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Tipo Sudadera</label>
                  <select id="sudadera_tipo" class="form-control form-control-dark">
                    <option value="">N/A</option>
                    <option value="Cerrada">Cerrada</option>
                    <option value="Con cierre">Con cierre</option>
                  </select>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-md-6 mb-3">
                  <div class="form-check form-switch">
                    <input type="checkbox" id="es_colaboracion" class="form-check-input">
                    <label class="form-check-label" for="es_colaboracion">Es colaboración</label>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="form-check form-switch">
                    <input type="checkbox" id="activo" class="form-check-input" checked>
                    <label class="form-check-label" for="activo">Activo en catálogo</label>
                  </div>
                </div>
              </div>
              <div id="colaboracionFields" style="display:none">
                <div class="row g-2">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Colaborador</label>
                    <select id="colaborador_id" class="form-control form-control-dark"></select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Detalle Colaboración</label>
                    <textarea id="detalle_colaboracion" class="form-control form-control-dark" rows="2"></textarea>
                  </div>
                </div>
              </div>
              <div class="mb-3 text-end">
                <button type="submit" class="btn btn-primary-custom">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
      document.body.appendChild(modalEl);
    }

    // Llenar selects con referencias
    const selectCat = modalEl.querySelector("#categoria_id");
    const selectTalla = modalEl.querySelector("#talla_id");
    const selectPatron = modalEl.querySelector("#patron_id");
    const selectColaborador = modalEl.querySelector("#colaborador_id");

    selectCat.innerHTML = cache.categorias
      .map(
        (c) =>
          `<option value="${c.categoria_id}">${Utils.escapeHtml(
            Utils.displayNameFor(c)
          )}</option>`
      )
      .join("");

    selectTalla.innerHTML =
      `<option value="">N/A</option>` +
      cache.tallas
        .map(
          (t) =>
            `<option value="${t.talla_id}">${Utils.escapeHtml(
              Utils.displayNameFor(t)
            )}</option>`
        )
        .join("");

    selectPatron.innerHTML =
      `<option value="">N/A</option>` +
      cache.patrones
        .map(
          (p) =>
            `<option value="${p.patron_id}">${Utils.escapeHtml(
              Utils.displayNameFor(p)
            )}</option>`
        )
        .join("");

    selectColaborador.innerHTML =
      `<option value="">N/A</option>` +
      cache.colaboradores
        .map(
          (c) =>
            `<option value="${c.colaborador_id}">${Utils.escapeHtml(
              Utils.displayNameFor(c)
            )}</option>`
        )
        .join("");

    const esColabCheck = modalEl.querySelector("#es_colaboracion");
    const colaboracionFields = modalEl.querySelector("#colaboracionFields");
    esColabCheck.onchange = (e) => {
      colaboracionFields.style.display = e.target.checked ? "block" : "none";
    };

    // Rellenar campos si edit
    if (producto) {
      modalEl.querySelector("#producto_id").value = producto.producto_id;
      modalEl.querySelector("#nombre_producto").value =
        producto.nombre_producto || "";
      modalEl.querySelector("#descripcion").value = producto.descripcion || "";
      modalEl.querySelector("#precio").value = producto.precio ?? "";
      modalEl.querySelector("#stock").value = producto.stock ?? 0;
      modalEl.querySelector("#url_imagen").value = producto.url_imagen || "";
      modalEl.querySelector("#categoria_id").value =
        producto.categoria_id || "";
      modalEl.querySelector("#talla_id").value = producto.talla_id || "";
      modalEl.querySelector("#color").value = producto.color || "";
      modalEl.querySelector("#genero").value = producto.genero || "";
      modalEl.querySelector("#tipo_prenda").value = producto.tipo_prenda || "";
      modalEl.querySelector("#patron_id").value = producto.patron_id || "";
      modalEl.querySelector("#sudadera_tipo").value =
        producto.sudadera_tipo || "";
      modalEl.querySelector("#activo").checked = producto.activo ?? true;

      if (producto.es_colaboracion) {
        modalEl.querySelector("#es_colaboracion").checked = true;
        modalEl.querySelector("#colaborador_id").value =
          producto.colaborador_id || "";
        modalEl.querySelector("#detalle_colaboracion").value =
          producto.detalle_colaboracion || "";
        colaboracionFields.style.display = "block";
      }
    } else {
      modalEl.querySelector("#producto_id").value = "";
      modalEl.querySelector("#nombre_producto").value = "";
      modalEl.querySelector("#descripcion").value = "";
      modalEl.querySelector("#precio").value = "";
      modalEl.querySelector("#stock").value = 0;
      modalEl.querySelector("#url_imagen").value = "";
      modalEl.querySelector("#categoria_id").value =
        cache.categorias[0]?.categoria_id || "";
      modalEl.querySelector("#talla_id").value = "";
      modalEl.querySelector("#color").value = "";
      modalEl.querySelector("#genero").value = "";
      modalEl.querySelector("#tipo_prenda").value = "";
      modalEl.querySelector("#patron_id").value = "";
      modalEl.querySelector("#sudadera_tipo").value = "";
      modalEl.querySelector("#activo").checked = true;
      modalEl.querySelector("#es_colaboracion").checked = false;
      modalEl.querySelector("#colaborador_id").value = "";
      modalEl.querySelector("#detalle_colaboracion").value = "";
    }

    const form = modalEl.querySelector("#productoForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      await ProductsAdmin.submitProductForm(modalEl);
    };

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  static async submitProductForm(modalEl) {
    const id = modalEl.querySelector("#producto_id").value || null;

    // Obtener fecha actual en zona horaria de México (America/Mexico_City)
    // Convertir la hora UTC actual a hora de México y luego a ISO string
    const ahora = new Date();
    const fechaMexicoString = ahora.toLocaleString("en-US", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // Parsear la fecha de México y convertir a ISO
    // El formato será: MM/DD/YYYY, HH:mm:ss
    const [fechaParte, horaParte] = fechaMexicoString.split(", ");
    const [mes, dia, anio] = fechaParte.split("/");
    const [hora, minuto, segundo] = horaParte.split(":");
    const fechaCreacion = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(
      2,
      "0"
    )}T${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}:${segundo.padStart(
      2,
      "0"
    )}`;

    const payload = {
      nombre_producto: modalEl.querySelector("#nombre_producto").value,
      descripcion: modalEl.querySelector("#descripcion").value,
      precio: parseFloat(modalEl.querySelector("#precio").value) || 0,
      stock: parseInt(modalEl.querySelector("#stock").value) || 0,
      url_imagen: modalEl.querySelector("#url_imagen").value || null,
      categoria_id:
        parseInt(modalEl.querySelector("#categoria_id").value) || null,
      talla_id: modalEl.querySelector("#talla_id").value
        ? parseInt(modalEl.querySelector("#talla_id").value)
        : null,
      color: modalEl.querySelector("#color").value || null,
      genero: modalEl.querySelector("#genero").value || null,
      tipo_prenda: modalEl.querySelector("#tipo_prenda").value || null,
      patron_id: modalEl.querySelector("#patron_id").value
        ? parseInt(modalEl.querySelector("#patron_id").value)
        : null,
      sudadera_tipo: modalEl.querySelector("#sudadera_tipo").value || null,
      activo: modalEl.querySelector("#activo").checked,
      es_colaboracion: modalEl.querySelector("#es_colaboracion").checked,
      colaborador_id: modalEl.querySelector("#es_colaboracion").checked
        ? parseInt(modalEl.querySelector("#colaborador_id").value)
        : null,
      detalle_colaboracion: modalEl.querySelector("#es_colaboracion").checked
        ? modalEl.querySelector("#detalle_colaboracion").value
        : null,
    };

    // Solo agregar fecha_creacion si es un producto nuevo
    if (!id) {
      payload.fecha_creacion = fechaCreacion;
    }

    try {
      if (id) {
        await API.fetch(`/productos/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notificaciones("Producto actualizado");
      } else {
        await API.fetch(`/productos`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notificaciones("Producto creado");
      }
      const bs = bootstrap.Modal.getInstance(modalEl);
      if (bs) bs.hide();
      await ProductsAdmin.loadAdminProductos();
    } catch (err) {
      notificaciones("Error guardando producto: " + err.message, "error");
    }
  }

  static async deleteProduct(id) {
    if (!confirm("¿Eliminar producto " + id + " ?")) return;
    try {
      await API.fetch(`/productos/${id}`, { method: "DELETE" });
      notificaciones("Producto eliminado");
      ProductsAdmin.loadAdminProductos();
    } catch (err) {
      notificaciones("Error eliminando producto: " + err.message, "error");
    }
  }
}

// Exponer proxies globales para compatibilidad con onClick inline
window.openProductForm = (id) => ProductsAdmin.openProductForm(id);
window.deleteProduct = (id) => ProductsAdmin.deleteProduct(id);

// ========================================
// SUBMODULO: Colaboradores (tabla admin)
// ========================================
class ColaboradoresAdmin {
  static async renderTable() {
    const existing = document.getElementById("colaboradores-table-container");
    if (existing) {
      return await ColaboradoresAdmin.refreshTable();
    }

    const section = document.getElementById("colaboradores");
    if (!section) return;
    const adminCard = section.querySelector(".admin-card");
    if (!adminCard) return;

    const container = document.createElement("div");
    container.id = "colaboradores-table-container";
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h3>Gestión de Colaboradores</h3>
          <button id="btnCrearColaborador" class="btn btn-primary-custom">
            <i class="bi bi-plus-circle"></i> Nuevo Colaborador
          </button>
        </div>
        <div class="table-responsive">
          <table class="admin-table" id="colaboradoresTable">
            <thead>
              <tr>
                <th class="col-min text-center" style="max-width:60px;">ID</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Detalle Acuerdo</th>
                <th class="col-actions text-center" style="width:110px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="colaboradoresTableBody"></tbody>
          </table>
        </div>
      </div>
    `;

    adminCard.innerHTML = "";
    adminCard.appendChild(container);

    await ColaboradoresAdmin.refreshTable();

    const btnCrear = document.getElementById("btnCrearColaborador");
    if (btnCrear)
      btnCrear.addEventListener("click", () =>
        References.showCreateEditForm("colaboradores")
      );
  }

  static async refreshTable() {
    const tbody = document.getElementById("colaboradoresTableBody");
    if (!tbody) return;
    try {
      const items = await API.fetchReference("colaboradores");
      cache.colaboradores = items;
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay colaboradores registrados</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map(
          (c) => `
        <tr data-id="${c.colaborador_id}">
          <td class="col-min text-center">${c.colaborador_id}</td>
          <td>${Utils.escapeHtml(c.nombre)}</td>
          <td>${Utils.escapeHtml(c.contacto || "")}</td>
          <td>${Utils.escapeHtml(c.detalle_acuerdo || "")}</td>
          <td class="col-actions text-center">
            <button class="btn btn-warning btn-sm edit-col" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-danger btn-sm del-col" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>`
        )
        .join("");

      tbody.querySelectorAll(".edit-col").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = btn.closest("tr").dataset.id;
          const item = cache.colaboradores.find((x) => x.colaborador_id == id);
          References.showCreateEditForm("colaboradores", item);
        });
      });
      tbody.querySelectorAll(".del-col").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = btn.closest("tr").dataset.id;
          if (!confirm("¿Eliminar colaborador id=" + id + "?")) return;
          try {
            await API.deleteReference("colaboradores", id);
            await ColaboradoresAdmin.refreshTable();
            notificaciones("Eliminado");
          } catch (err) {
            notificaciones(
              "Error eliminando: " + (err.message || err),
              "error"
            );
          }
        });
      });
    } catch (err) {
      console.error("Error cargando colaboradores:", err);
      tbody.innerHTML = `<tr><td colspan="5">Error cargando colaboradores</td></tr>`;
    }
  }
}

// ========================================
// SUBMODULO: Clientes (admin CRUD)
// ========================================
class ClientesAdmin {
  static async renderTable() {
    const section = document.getElementById("clientes");
    if (!section) return;
    const existing = document.getElementById("clientes-table-container");
    if (existing) return await ClientesAdmin.refreshTable();

    const adminCard = section.querySelector(".admin-card");
    if (!adminCard) return;

    const container = document.createElement("div");
    container.id = "clientes-table-container";
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h3>Gestión de Clientes</h3>
          <button id="btnCrearCliente" class="btn btn-primary-custom">
            <i class="bi bi-plus-circle"></i> Nuevo Cliente
          </button>
        </div>
        <div class="table-responsive">
          <table class="admin-table" id="clientesTable">
            <thead>
              <tr>
                <th class="col-min text-center" style="max-width:60px;">ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Dirección</th>
                <th>Usuario</th>
                <th>Contraseña</th>
                <th>Es Admin</th>
                <th class="col-actions text-center" style="width:110px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="clientesTableBody"></tbody>
          </table>
        </div>
      </div>
    `;

    adminCard.innerHTML = "";
    adminCard.appendChild(container);

    document
      .getElementById("btnCrearCliente")
      .addEventListener("click", (e) => {
        e.preventDefault();
        ClientesAdmin.openClienteForm();
      });

    await ClientesAdmin.refreshTable();
  }

  static async refreshTable() {
    const tbody = document.getElementById("clientesTableBody");
    if (!tbody) return;
    try {
      const res = await API.fetch("/clientes?limit=200");
      const items = res.items || [];
      window.clientesCache = items;
      if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No hay clientes registrados</td></tr>`;
        return;
      }
      tbody.innerHTML = items
        .map((c) => {
          const id = c.cliente_id ?? c.id ?? "";
          return `
            <tr data-id="${id}">
              <td class="col-min text-center">${id}</td>
              <td>${Utils.escapeHtml(c.nombre || "")}</td>
              <td>${Utils.escapeHtml(c.telefono || "")}</td>
              <td>${Utils.escapeHtml(c.email || "")}</td>
              <td>${Utils.escapeHtml(c.direccion || "")}</td>
              <td>${Utils.escapeHtml(c.usuario || "")}</td>
              <td>${Utils.escapeHtml(c.password || "")}</td>
              <td>${Utils.escapeHtml(c.es_admin ? "Sí" : "No")}</td>
              <td class="col-actions text-center">
                <button class="btn btn-sm btn-outline-light me-2" onclick="openClienteForm(${id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCliente(${id})">Eliminar</button>
              </td>
            </tr>
          `;
        })
        .join("");
    } catch (err) {
      console.error("Error cargando clientes:", err.message);
      tbody.innerHTML = `<tr><td colspan="9">Error cargando clientes: ${Utils.escapeHtml(
        err.message
      )}</td></tr>`;
    }
  }

  static async openClienteForm(clienteId = null) {
    let cliente = null;
    if (clienteId) {
      cliente = (window.clientesCache || []).find(
        (c) => c.cliente_id == clienteId
      );
      if (!cliente) {
        try {
          cliente = await API.fetch(`/clientes/${clienteId}`);
        } catch (err) {
          console.warn("No se pudo obtener cliente", err.message);
        }
      }
    }

    let modalEl = document.getElementById("clienteModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "clienteModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content modal-dark">
            <div class="modal-header">
              <h5 class="modal-title">Cliente</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="clienteForm">
                <input type="hidden" id="cliente_id">
                <div class="mb-3"><label class="form-label">Nombre</label><input id="cliente_nombre" class="form-control form-control-dark" required></div>
                <div class="mb-3"><label class="form-label">Teléfono</label><input id="cliente_telefono" class="form-control form-control-dark"></div>
                <div class="mb-3"><label class="form-label">Email</label><input id="cliente_email" type="email" class="form-control form-control-dark"></div>
                <div class="mb-3"><label class="form-label">Dirección</label><input id="cliente_direccion" class="form-control form-control-dark"></div>
                <div class="mb-3"><label class="form-label">Usuario</label><input id="cliente_usuario" class="form-control form-control-dark" required></div>
                <div class="mb-3"><label class="form-label">Contraseña</label><input id="cliente_password" type="password" class="form-control form-control-dark"><small class="text-muted">Dejar vacío al editar si no desea cambiar la contraseña.</small></div>
                <div class="form-check form-switch mb-3"><input type="checkbox" id="cliente_es_admin" class="form-check-input"><label class="form-check-label" for="cliente_es_admin">Es administrador</label></div>
                <div class="text-end"><button class="btn btn-primary-custom" type="submit">Guardar</button></div>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    modalEl.querySelector("#cliente_id").value = cliente
      ? cliente.cliente_id || ""
      : "";
    modalEl.querySelector("#cliente_nombre").value = cliente
      ? cliente.nombre || ""
      : "";
    modalEl.querySelector("#cliente_telefono").value = cliente
      ? cliente.telefono || ""
      : "";
    modalEl.querySelector("#cliente_email").value = cliente
      ? cliente.email || ""
      : "";
    modalEl.querySelector("#cliente_direccion").value = cliente
      ? cliente.direccion || ""
      : "";
    modalEl.querySelector("#cliente_usuario").value = cliente
      ? cliente.usuario || ""
      : "";
    modalEl.querySelector("#cliente_password").value = "";
    modalEl.querySelector("#cliente_es_admin").checked = cliente
      ? !!cliente.es_admin
      : false;

    const form = modalEl.querySelector("#clienteForm");
    form.onsubmit = async (e) => {
      e.preventDefault();
      const id = modalEl.querySelector("#cliente_id").value || null;
      const payload = {};
      payload.nombre = modalEl.querySelector("#cliente_nombre").value || "";
      // Enviar cadena vacía si no capturan teléfono para evitar NULL en BD
      payload.telefono = modalEl.querySelector("#cliente_telefono").value || "";
      payload.email = modalEl.querySelector("#cliente_email").value || null;
      // Enviar cadena vacía si dejan dirección vacía para evitar NULL en BD
      payload.direccion =
        modalEl.querySelector("#cliente_direccion").value || "";
      payload.usuario = modalEl.querySelector("#cliente_usuario").value || "";
      const pwd = modalEl.querySelector("#cliente_password").value;
      payload.password = pwd || "";
      payload.es_admin = modalEl.querySelector("#cliente_es_admin").checked;

      try {
        if (id) {
          await API.fetch(`/clientes/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          await API.fetch(`/clientes`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }
        const bs =
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        bs.hide();
        await ClientesAdmin.refreshTable();
      } catch (err) {
        console.error("Error guardando cliente:", err.message);
        alert("Error: " + err.message);
      }
    };

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  static async deleteCliente(id) {
    if (!confirm(`¿Eliminar cliente ${id} ?`)) return;
    try {
      await API.fetch(`/clientes/${id}`, { method: "DELETE" });
      await ClientesAdmin.refreshTable();
    } catch (err) {
      console.error("Error eliminando cliente:", err.message);
      notificaciones("Error: " + err.message, "error");
    }
  }
}

// Exponer proxies globales para compatibilidad
window.openClienteForm = (id) => ClientesAdmin.openClienteForm(id);
window.deleteCliente = (id) => ClientesAdmin.deleteCliente(id);

// ========================================
// SUBMODULO: Pedidos (admin CRUD completo con detalles)
// ========================================
class PedidosAdmin {
  static async renderTable() {
    const container = document.getElementById("admin-pedidos-content");
    if (!container) return;

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-header">
          <h3>Gestión de Pedidos</h3>
          <button class="btn btn-primary-custom" onclick="openPedidoForm()">
            <i class="bi bi-plus-circle"></i> Nuevo Pedido
          </button>
        </div>
        <div class="admin-toolbar container-fluid px-0 mb-3">
          <div class="row g-2 align-items-end">
            <div class="col-12 col-md-3">
              <label class="form-label">Nombre cliente</label>
              <input type="text" id="filter_nombre" class="form-control" placeholder="Nombre o email">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label">Estatus</label>
              <select id="filter_estatus" class="form-select">
                <option value="">Todos</option>
                <option value="POR PAGAR">Por Pagar</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="PAGADO">Pagado</option>
                <option value="EN PROCESO">En Proceso</option>
                <option value="ENVIADO">Enviado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label">Desde</label>
              <input type="date" id="filter_desde" class="form-control">
            </div>
            <div class="col-6 col-md-2">
              <label class="form-label">Hasta</label>
              <input type="date" id="filter_hasta" class="form-control">
            </div>
            <div class="col-12 col-md-3 d-flex flex-wrap gap-2">
              <button id="btnAplicarFiltros" class="btn btn-primary-custom flex-fill"><i class="bi bi-funnel"></i> Aplicar</button>
              <button id="btnLimpiarFiltros" class="btn btn-secondary flex-fill"><i class="bi bi-eraser"></i> Limpiar</button>
              <button id="btnExportarPedidos" class="btn btn-success flex-fill"><i class="bi bi-file-earmark-spreadsheet"></i> Exportar</button>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="admin-table" id="pedidos-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Método Pago</th>
                <th>Estatus</th>
                <th>Monto Total</th>
                <th>Items</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="8" class="text-center">Cargando pedidos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Restaurar filtros previamente usados (si existen)
    if (this._filters) {
      const { nombre, estatus, desde, hasta } = this._filters;
      const $ = (id) => document.getElementById(id);
      if ($("filter_nombre")) $("filter_nombre").value = nombre || "";
      if ($("filter_estatus")) $("filter_estatus").value = estatus || "";
      if ($("filter_desde")) $("filter_desde").value = desde || "";
      if ($("filter_hasta")) $("filter_hasta").value = hasta || "";
    }

    // Listeners de filtros y exportación
    document
      .getElementById("btnAplicarFiltros")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this.refreshTable();
      });
    document
      .getElementById("btnLimpiarFiltros")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        const $ = (id) => document.getElementById(id);
        if ($("filter_nombre")) $("filter_nombre").value = "";
        if ($("filter_estatus")) $("filter_estatus").value = "";
        if ($("filter_desde")) $("filter_desde").value = "";
        if ($("filter_hasta")) $("filter_hasta").value = "";
        this.refreshTable();
      });
    document
      .getElementById("btnExportarPedidos")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this.exportarPedidos();
      });

    await this.refreshTable();
  }

  static async refreshTable() {
    try {
      const $ = (id) => document.getElementById(id);
      const nombre = $("filter_nombre")?.value?.trim() || "";
      const estatus = $("filter_estatus")?.value || "";
      const desde = $("filter_desde")?.value || "";
      const hasta = $("filter_hasta")?.value || "";

      // Persistir filtros actuales
      this._filters = { nombre, estatus, desde, hasta };

      // Construir query para API (limitado a 200)
      const qs = new URLSearchParams();
      qs.set("limit", "200");
      qs.set("skip", "0");
      if (estatus) qs.set("estatus", estatus);
      if (desde) qs.set("desde", desde);
      if (hasta) qs.set("hasta", hasta);

      const pedidos = await API.fetch(`/pedidos?${qs.toString()}`);
      const clientes = await API.fetchReference("clientes");
      const tbody = document.querySelector("#pedidos-table tbody");

      if (!tbody) return;

      // Si hay filtro por nombre, aplicar en frontend
      let filtered = Array.isArray(pedidos) ? pedidos : [];
      if (nombre) {
        const nameLC = nombre.toLowerCase();
        const clienteIds = new Set(
          clientes
            .filter((c) => {
              const full = `${c.nombre || ""} ${
                c.apellido || ""
              }`.toLowerCase();
              const email = (c.email || "").toLowerCase();
              const usuario = (c.usuario || "").toLowerCase();
              return (
                full.includes(nameLC) ||
                email.includes(nameLC) ||
                usuario.includes(nameLC)
              );
            })
            .map((c) => c.cliente_id)
        );
        filtered = filtered.filter((p) => clienteIds.has(p.cliente_id));
      }

      // Guardar último dataset para exportar
      this._lastPedidos = filtered;
      this._lastClientes = clientes;

      if (!filtered || filtered.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="8" class="text-center">No hay pedidos registrados</td></tr>';
        return;
      }

      tbody.innerHTML = filtered
        .map((p) => {
          const cliente = clientes.find((c) => c.cliente_id === p.cliente_id);
          const clienteNombre = cliente
            ? `${cliente.nombre} ${cliente.apellido}`
            : `ID: ${p.cliente_id}`;
          const fecha = new Date(p.fecha_pedido).toLocaleDateString();
          const numItems = p.detalles ? p.detalles.length : 0;

          return `
            <tr>
              <td>${p.pedido_id}</td>
              <td>${Utils.escapeHtml(clienteNombre)}</td>
              <td>${fecha}</td>
              <td>${Utils.escapeHtml(p.metodo_pago)}</td>
              <td><span class="badge badge-${this._getStatusColor(
                p.estatus
              )}">${Utils.escapeHtml(p.estatus)}</span></td>
              <td>$${parseFloat(p.monto_total).toFixed(2)}</td>
              <td>${numItems}</td>
              <td class="actions">
                <button class="btn btn-info btn-sm" onclick="viewPedidoDetalles(${
                  p.pedido_id
                })" title="Ver Detalles">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-warning btn-sm" onclick="openPedidoForm(${
                  p.pedido_id
                })" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePedido(${
                  p.pedido_id
                })" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      const tbody = document.querySelector("#pedidos-table tbody");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="8" class="text-center text-danger">Error al cargar pedidos</td></tr>';
      }
    }
  }

  static async exportarPedidos() {
    const filters = this._filters || {};
    const nombre = (filters.nombre || "").trim();
    const estatus = filters.estatus || "";
    const desde = filters.desde || "";
    const hasta = filters.hasta || "";

    // Intentar server-side export (mejor para grandes volúmenes)
    let clienteIdParam;
    if (nombre) {
      const clientes =
        this._lastClientes || (await API.fetchReference("clientes"));
      const nameLC = nombre.toLowerCase();
      const matches = clientes.filter((c) => {
        const full = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        const usuario = (c.usuario || "").toLowerCase();
        return (
          full.includes(nameLC) ||
          email.includes(nameLC) ||
          usuario.includes(nameLC)
        );
      });
      if (matches.length === 1) clienteIdParam = matches[0].cliente_id;
    }

    if (!nombre || clienteIdParam) {
      // Descargar desde el servidor como CSV
      const qs = new URLSearchParams();
      if (estatus) qs.set("estatus", estatus);
      if (desde) qs.set("desde", desde);
      if (hasta) qs.set("hasta", hasta);
      if (clienteIdParam) qs.set("cliente_id", String(clienteIdParam));
      try {
        const csv = await API.fetchText(
          `/pedidos/export${qs.toString() ? "?" + qs.toString() : ""}`
        );
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pedidos.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      } catch (e) {
        console.error("Fallo exportación servidor, se intentará local:", e);
      }
    }

    // Fallback: generar CSV localmente con lo que se ve en la tabla
    const pedidos = this._lastPedidos || [];
    const clientes = this._lastClientes || [];
    const mapCliente = new Map(
      clientes.map((c) => [
        c.cliente_id,
        `${c.nombre || ""} ${c.apellido || ""}`.trim(),
      ])
    );
    const header = [
      "ID",
      "Cliente",
      "Fecha",
      "Método Pago",
      "Estatus",
      "Monto Total",
      "Items",
    ];
    const rows = pedidos.map((p) => {
      const clienteNombre =
        mapCliente.get(p.cliente_id) || `ID: ${p.cliente_id}`;
      const fecha = p.fecha_pedido
        ? new Date(p.fecha_pedido).toLocaleString()
        : "";
      const numItems = Array.isArray(p.detalles) ? p.detalles.length : 0;
      return [
        p.pedido_id,
        clienteNombre,
        fecha,
        p.metodo_pago || "",
        p.estatus || "",
        p.monto_total != null ? Number(p.monto_total).toFixed(2) : "0.00",
        numItems,
      ];
    });

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pedidos.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  static _getStatusColor(estatus) {
    const status = estatus.toUpperCase();
    if (status.includes("PAGAR")) return "warning";
    if (status.includes("PAGADO") || status.includes("COMPLETADO"))
      return "success";
    if (status.includes("CANCELADO")) return "danger";
    if (status.includes("ENTREGADO")) return "info";
    return "secondary";
  }

  static async openPedidoForm(pedidoId = null) {
    const isEdit = pedidoId !== null;
    let pedido = null;
    let detallesData = [];

    // Cargar datos si es edición
    if (isEdit) {
      try {
        pedido = await API.fetch(`/pedidos/${pedidoId}`);
        detallesData = pedido.detalles || [];
      } catch (error) {
        notificaciones("Error al cargar el pedido", "error");
        return;
      }
    }

    // Cargar referencias necesarias y actualizar el cache
    const clientes = await API.fetchReference("clientes");
    const productos = await API.fetchReference("productos");
    const colaboradores = await API.fetchReference("colaboradores");

    console.log("Clientes cargados:", clientes.length);
    console.log("Productos cargados:", productos.length);
    console.log("Colaboradores cargados:", colaboradores.length);

    // Actualizar cache de productos para que estén disponibles en addDetalleRow
    cache.productos = productos;
    cache.colaboradores = colaboradores;

    // También almacenar en variables globales temporales para el formulario actual
    window._pedidoFormProductos = productos;
    window._pedidoFormColaboradores = colaboradores;

    const modalHTML = `
      <div class="modal-overlay" id="pedido-modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>${isEdit ? "Editar Pedido" : "Nuevo Pedido"}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="pedido-form" class="admin-form">
              <input type="hidden" id="pedido_id" value="${
                pedido?.pedido_id || 0
              }">
              
              <div class="form-row">
                <div class="form-group">
                  <label for="cliente_id">Cliente *</label>
                  <select id="cliente_id" required>
                    <option value="">Seleccionar cliente...</option>
                    ${clientes
                      .map(
                        (c) => `
                      <option value="${c.cliente_id}" ${
                          pedido?.cliente_id === c.cliente_id ? "selected" : ""
                        }>
                        ${Utils.escapeHtml(c.nombre)} ${Utils.escapeHtml(
                          c.apellido
                        )} - ${Utils.escapeHtml(c.email)}
                      </option>
                    `
                      )
                      .join("")}
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="fecha_pedido">Fecha Pedido *</label>
                  <input type="datetime-local" id="fecha_pedido" required
                    value="${
                      pedido
                        ? new Date(pedido.fecha_pedido)
                            .toISOString()
                            .slice(0, 16)
                        : new Date().toISOString().slice(0, 16)
                    }">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="metodo_pago">Método de Pago *</label>
                  <select id="metodo_pago" required>
                    <option value="EFECTIVO" ${
                      pedido?.metodo_pago === "EFECTIVO" ? "selected" : ""
                    }>Efectivo</option>
                    <option value="DEPOSITO" ${
                      pedido?.metodo_pago === "DEPOSITO" ? "selected" : ""
                    }>Depósito</option>
                    <option value="transferencia" ${
                      pedido?.metodo_pago === "transferencia" ? "selected" : ""
                    }>Transferencia</option>
                    <option value="TARJETA" ${
                      pedido?.metodo_pago === "TARJETA" ? "selected" : ""
                    }>Tarjeta</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="estatus">Estatus *</label>
                  <select id="estatus" required>
                    <option value="POR PAGAR" ${
                      pedido?.estatus === "POR PAGAR" ? "selected" : ""
                    }>Por Pagar</option>
                    <option value="PENDIENTE" ${
                      pedido?.estatus === "PENDIENTE" ? "selected" : ""
                    }>Pendiente</option>
                    <option value="PAGADO" ${
                      pedido?.estatus === "PAGADO" ? "selected" : ""
                    }>Pagado</option>
                    <option value="EN PROCESO" ${
                      pedido?.estatus === "EN PROCESO" ? "selected" : ""
                    }>En Proceso</option>
                    <option value="ENVIADO" ${
                      pedido?.estatus === "ENVIADO" ? "selected" : ""
                    }>Enviado</option>
                    <option value="ENTREGADO" ${
                      pedido?.estatus === "ENTREGADO" ? "selected" : ""
                    }>Entregado</option>
                    <option value="CANCELADO" ${
                      pedido?.estatus === "CANCELADO" ? "selected" : ""
                    }>Cancelado</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="monto_total">Monto Total</label>
                  <input type="number" id="monto_total" step="0.01" min="0" 
                    value="${pedido?.monto_total || 0}" 
                    placeholder="Se calculará automáticamente">
                  <small>Dejar en 0 para cálculo automático</small>
                </div>
              </div>

              <div class="form-group">
                <label for="direccion_entrega">Dirección de Entrega</label>
                <textarea id="direccion_entrega" rows="2">${
                  pedido?.direccion_entrega || ""
                }</textarea>
              </div>

              <div class="form-group">
                <label for="instrucciones_entrega">Instrucciones de Entrega</label>
                <textarea id="instrucciones_entrega" rows="2">${
                  pedido?.instrucciones_entrega || ""
                }</textarea>
              </div>

              <hr>
              
              <div class="detalles-section">
                <div class="admin-header">
                  <h4>Detalles del Pedido</h4>
                  <button type="button" class="btn btn-primary-custom btn-sm" onclick="PedidosAdmin.addDetalleRow()">
                    <i class="bi bi-plus-circle"></i> Agregar Item
                  </button>
                </div>
                
                <div id="detalles-container">
                  ${
                    detallesData.length > 0
                      ? ""
                      : '<p class="text-muted">No hay items. Haz clic en "Agregar Item" para comenzar.</p>'
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button type="submit" class="btn btn-primary-custom">
                  ${isEdit ? "Actualizar Pedido" : "Crear Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Cargar detalles si es edición
    if (detallesData.length > 0) {
      detallesData.forEach((detalle) => {
        this.addDetalleRow(detalle, productos, colaboradores);
      });
    }

    // Submit handler
    document
      .getElementById("pedido-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.submitPedidoForm();
      });
  }

  static addDetalleRow(
    detalle = null,
    productosData = null,
    colaboradoresData = null
  ) {
    const container = document.getElementById("detalles-container");
    // Primero intentar usar datos pasados, luego variables globales temporales, finalmente el cache
    const productos =
      productosData || window._pedidoFormProductos || cache.productos || [];
    const colaboradores =
      colaboradoresData ||
      window._pedidoFormColaboradores ||
      cache.colaboradores ||
      [];

    console.log("Productos disponibles:", productos.length);
    console.log("Colaboradores disponibles:", colaboradores.length);

    if (productos.length === 0) {
      console.warn("No hay productos cargados en el cache");
      alert(
        "Error: No se han cargado los productos. Por favor, recarga la página e intenta nuevamente."
      );
      return;
    }

    // Limpiar mensaje de "no hay items"
    const emptyMsg = container.querySelector("p.text-muted");
    if (emptyMsg) emptyMsg.remove();

    const detalleId = detalle?.detalle_id || 0;
    const rowId = `detalle-row-${Date.now()}-${Math.random()}`;

    const rowHTML = `
      <div class="detalle-row" id="${rowId}" data-detalle-id="${detalleId}">
        <div class="detalle-card">
          <button type="button" class="btn btn-danger btn-sm detalle-remove" onclick="this.closest('.detalle-row').remove()">
            <i class="bi bi-x-circle"></i>
          </button>
          
          <div class="form-row">
            <div class="form-group">
              <label>Producto *</label>
              <select class="detalle-producto" required>
                <option value="">Seleccionar producto...</option>
                ${productos
                  .map(
                    (p) => `
                  <option value="${p.producto_id}" data-precio="${p.precio}" ${
                      detalle?.producto_id === p.producto_id ? "selected" : ""
                    }>
                    ${Utils.escapeHtml(
                      p.nombre_producto || p.nombre || "Sin nombre"
                    )} - $${p.precio} (Stock: ${p.stock})
                  </option>
                `
                  )
                  .join("")}
              </select>
            </div>

            <div class="form-group">
              <label>Cantidad *</label>
              <input type="number" class="detalle-cantidad" min="1" value="${
                detalle?.cantidad || 1
              }" required>
            </div>

            <div class="form-group">
              <label>Precio Unitario *</label>
              <input type="number" class="detalle-precio" step="0.01" min="0" value="${
                detalle?.precio_unitario || 0
              }" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Colaborador</label>
              <select class="detalle-colaborador">
                <option value="">Sin colaborador</option>
                ${colaboradores
                  .map(
                    (c) => `
                  <option value="${c.colaborador_id}" ${
                      detalle?.colaborador_id === c.colaborador_id
                        ? "selected"
                        : ""
                    }>
                    ${Utils.escapeHtml(c.nombre)} ${Utils.escapeHtml(
                      c.apellido
                    )}
                  </option>
                `
                  )
                  .join("")}
              </select>
            </div>

            <div class="form-group">
              <label>Comisión Pagada</label>
              <input type="checkbox" class="detalle-comision" ${
                detalle?.comision_pagada ? "checked" : ""
              }>
            </div>
          </div>

          <div class="form-group">
            <label>Notas de Personalización</label>
            <textarea class="detalle-notas" rows="2">${
              detalle?.notas_personalizacion || ""
            }</textarea>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", rowHTML);

    // Auto-actualizar precio cuando cambia el producto
    const row = document.getElementById(rowId);
    const selectProducto = row.querySelector(".detalle-producto");
    const inputPrecio = row.querySelector(".detalle-precio");

    selectProducto.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const precio = selectedOption.getAttribute("data-precio");
      if (precio) {
        inputPrecio.value = precio;
      }
    });
  }

  static async submitPedidoForm() {
    const pedidoId = parseInt(document.getElementById("pedido_id").value);
    const isEdit = pedidoId > 0;

    // Recolectar datos del formulario
    const formData = {
      pedido_id: pedidoId,
      cliente_id: parseInt(document.getElementById("cliente_id").value),
      fecha_pedido: document.getElementById("fecha_pedido").value,
      metodo_pago: document.getElementById("metodo_pago").value,
      estatus: document.getElementById("estatus").value,
      monto_total:
        parseFloat(document.getElementById("monto_total").value) || null,
      direccion_entrega:
        document.getElementById("direccion_entrega").value || null,
      instrucciones_entrega:
        document.getElementById("instrucciones_entrega").value || null,
      detalles: [],
    };

    // Recolectar detalles
    const detalleRows = document.querySelectorAll(".detalle-row");
    if (detalleRows.length === 0) {
      alert("Debe agregar al menos un item al pedido");
      return;
    }

    detalleRows.forEach((row) => {
      const detalleId = parseInt(row.getAttribute("data-detalle-id")) || 0;
      const productoId = parseInt(row.querySelector(".detalle-producto").value);
      const cantidad = parseInt(row.querySelector(".detalle-cantidad").value);
      const precioUnitario = parseFloat(
        row.querySelector(".detalle-precio").value
      );
      const colaboradorId = row.querySelector(".detalle-colaborador").value;
      const comisionPagada = row.querySelector(".detalle-comision").checked;
      const notas = row.querySelector(".detalle-notas").value;

      formData.detalles.push({
        detalle_id: detalleId,
        producto_id: productoId,
        cantidad: cantidad,
        precio_unitario: precioUnitario,
        colaborador_id: colaboradorId ? parseInt(colaboradorId) : null,
        comision_pagada: comisionPagada,
        notas_personalizacion: notas || null,
      });
    });

    try {
      if (isEdit) {
        await API.updateReference("pedidos", pedidoId, formData);
        notificaciones("Pedido actualizado exitosamente");
      } else {
        await API.createReference("pedidos", formData);
        notificaciones("Pedido creado exitosamente");
      }

      document.getElementById("pedido-modal").remove();
      await this.refreshTable();
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      notificaciones(
        `Error al guardar el pedido: ${error.message || "Error desconocido"}`,
        "error"
      );
    }
  }

  static async viewPedidoDetalles(pedidoId) {
    try {
      const pedido = await API.fetch(`/pedidos/${pedidoId}`);
      const clientes = await API.fetchReference("clientes");
      const productos = await API.fetchReference("productos");
      const colaboradores = await API.fetchReference("colaboradores");

      const cliente = clientes.find((c) => c.cliente_id === pedido.cliente_id);
      const clienteNombre = cliente
        ? `${cliente.nombre} ${cliente.apellido}`
        : `ID: ${pedido.cliente_id}`;

      const modalHTML = `
        <div class="modal-overlay" id="pedido-detalles-modal">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h3>Detalles del Pedido #${pedido.pedido_id}</h3>
              <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
              <div class="pedido-info-grid">
                <div class="info-group">
                  <label>Cliente:</label>
                  <span>${Utils.escapeHtml(clienteNombre)}</span>
                </div>
                <div class="info-group">
                  <label>Fecha:</label>
                  <span>${new Date(pedido.fecha_pedido).toLocaleString()}</span>
                </div>
                <div class="info-group">
                  <label>Método de Pago:</label>
                  <span>${Utils.escapeHtml(pedido.metodo_pago)}</span>
                </div>
                <div class="info-group">
                  <label>Estatus:</label>
                  <span class="badge badge-${this._getStatusColor(
                    pedido.estatus
                  )}">${Utils.escapeHtml(pedido.estatus)}</span>
                </div>
                <div class="info-group">
                  <label>Monto Total:</label>
                  <span class="text-success font-weight-bold">$${parseFloat(
                    pedido.monto_total
                  ).toFixed(2)}</span>
                </div>
              </div>

              ${
                pedido.direccion_entrega
                  ? `
                <div class="info-group mt-3">
                  <label>Dirección de Entrega:</label>
                  <p>${Utils.escapeHtml(pedido.direccion_entrega)}</p>
                </div>
              `
                  : ""
              }

              ${
                pedido.instrucciones_entrega
                  ? `
                <div class="info-group">
                  <label>Instrucciones:</label>
                  <p>${Utils.escapeHtml(pedido.instrucciones_entrega)}</p>
                </div>
              `
                  : ""
              }

              <hr>

              <h4>Items del Pedido</h4>
              <div class="table-responsive">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                      <th>Colaborador</th>
                      <th>Comisión</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pedido.detalles
                      .map((d) => {
                        const producto = productos.find(
                          (p) => p.producto_id === d.producto_id
                        );
                        const colaborador = colaboradores.find(
                          (c) => c.colaborador_id === d.colaborador_id
                        );
                        const subtotal = d.cantidad * d.precio_unitario;

                        return `
                        <tr>
                          <td>${
                            producto
                              ? Utils.escapeHtml(producto.nombre)
                              : `ID: ${d.producto_id}`
                          }</td>
                          <td>${d.cantidad}</td>
                          <td>$${parseFloat(d.precio_unitario).toFixed(2)}</td>
                          <td>$${subtotal.toFixed(2)}</td>
                          <td>${
                            colaborador
                              ? `${Utils.escapeHtml(
                                  colaborador.nombre
                                )} ${Utils.escapeHtml(colaborador.apellido)}`
                              : "-"
                          }</td>
                          <td>${
                            d.comision_pagada
                              ? '<span class="badge badge-success">Sí</span>'
                              : '<span class="badge badge-secondary">No</span>'
                          }</td>
                          <td>${
                            d.notas_personalizacion
                              ? Utils.escapeHtml(d.notas_personalizacion)
                              : "-"
                          }</td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                <button class="btn btn-primary-custom" onclick="this.closest('.modal-overlay').remove(); openPedidoForm(${pedidoId})">
                  <i class="bi bi-pencil"></i> Editar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      notificaciones("Error al cargar los detalles del pedido", "error");
    }
  }

  static async deletePedido(pedidoId) {
    if (
      !confirm(
        "¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer y devolverá el stock de los productos."
      )
    ) {
      return;
    }

    try {
      await API.deleteReference("pedidos", pedidoId);
      notificaciones("Pedido eliminado exitosamente");
      await this.refreshTable();
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      notificaciones("Error al eliminar el pedido", "error");
    }
  }
}

// Exponer proxies globales para compatibilidad
window.openPedidoForm = (id) => PedidosAdmin.openPedidoForm(id);
window.viewPedidoDetalles = (id) => PedidosAdmin.viewPedidoDetalles(id);
window.deletePedido = (id) => PedidosAdmin.deletePedido(id);

// ========================================
// Inicialización global
// ========================================
app.init();

// ========================================
// Limpieza de código muerto / eliminado
// - Se eliminaron las funciones `clampLimit` y `urlWithLimit` del código original
//   ya que nunca fueron usadas en el archivo. Si las necesitas en otro contexto,
//   las puedo restaurar.
// - Se unificó y reagrupó TODO el código relacionado a cada "página" o "módulo"
//   en clases para facilitar mantenimiento y lectura.
// ========================================
