import { Utils } from "../utils/utils.js";
import { productosData } from "../utils/productosData.js";
import { API } from "../api/apiClient.js";
import { notificaciones } from "../utils/notificaciones.js";

// MÓDULO: Carrito (funciones relacionadas al carrito)
export class Cart {
  constructor() {
    this.items = this.loadCart();
  }

  loadCart() {
    try {
      const stored = localStorage.getItem("carrito");
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // CAMBIO DE SEGURIDAD: Validar y sanitizar datos del carrito
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          producto_id: parseInt(item.producto_id) || 0,
          nombre: String(item.nombre || "").substring(0, 200), // Limitar longitud
          precio: parseFloat(item.precio) || 0,
          cantidad: Math.max(1, Math.min(99, parseInt(item.cantidad) || 1)), // Entre 1-99
          talla_id: parseInt(item.talla_id) || null,
          color_id: parseInt(item.color_id) || null,
          imagen: String(item.imagen || "").substring(0, 500), // Limitar URL
          // NO guardar: información del usuario, tokens, datos sensibles
        }))
        .filter((item) => item.producto_id > 0); // Validar IDs válidos
    } catch (e) {
      console.error("Error al cargar carrito:", e);
      return [];
    }
  }

  saveCart() {
    try {
      // CAMBIO DE SEGURIDAD: Sanitizar antes de guardar
      const sanitized = this.items.map((item) => ({
        producto_id: parseInt(item.producto_id) || 0,
        nombre: String(item.nombre || "").substring(0, 200),
        precio: parseFloat(item.precio) || 0,
        cantidad: Math.max(1, Math.min(99, parseInt(item.cantidad) || 1)),
        talla_id: parseInt(item.talla_id) || null,
        color_id: parseInt(item.color_id) || null,
        imagen: String(item.imagen || "").substring(0, 500),
      }));

      localStorage.setItem("carrito", JSON.stringify(sanitized));
    } catch (e) {
      console.error("Error al guardar carrito:", e);
    }
  }

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
  //mi cuenta
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
                        onclick="Cart.editarPedidoDesdeCliente(${
                          pedido.pedido_id
                        })"
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
                            <td>$${(detalle.precio_unitario || 0).toFixed(
                              2
                            )}</td>
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
                                    <span>${Utils.escapeHtml(
                                      item.nombre
                                    )}</span>
                                  </div>
                                </td>
                                <td>${item.cantidad}</td>
                                <td>$${item.precio.toFixed(2)}</td>
                                <td><strong>$${subtotal}</strong></td>
                                <td>${
                                  item.notas_personalizacion
                                    ? Utils.escapeHtml(
                                        item.notas_personalizacion
                                      )
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

    console.log("Enviando pedido:");

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
  //ventana
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
