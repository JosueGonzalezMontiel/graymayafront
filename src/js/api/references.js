import { API } from "../api/apiClient.js";
import { cache } from "../utils/cache.js";
import { Utils } from "../utils/utils.js";
import { notificaciones } from "../utils/notificaciones.js";

export class References {
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

  static async showCreateEditForm(resource, item = null) {
    // Pega el método completo y cambia estas dos llamadas internas:
    // - Reemplaza "ColaboradoresAdmin.refreshTable()" por:
    //   window.ColaboradoresAdmin?.refreshTable()
    // - Reemplaza "References.refreshReferenceTable(resType)" igual se queda
    // - Si quieres refrescar productos desde aquí (no es necesario), usa:
    //   window.ProductsAdmin?.loadAdminProductos()
    // ...existing code...
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
            await window.ColaboradoresAdmin?.refreshTable();
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
