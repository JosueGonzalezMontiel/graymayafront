import { API } from "../api/apiClient.js";
import { Cart } from "../components/Cart.js";
import { InicioPage } from "../pages/InicioPage.js";
import { CatalogoPage } from "../pages/CatalogoPage.js";
import {
  PanelControlPage,
  ProductsAdmin,
  ColaboradoresAdmin,
  ClientesAdmin,
  PedidosAdmin,
} from "../pages/PanelControlPage.js";
import { References } from "../api/references.js";
import { AdminLoginModal } from "../components/AdminLoginModal.js";
import { AdminAuth } from "../services/adminAuth.js";

// Stubs si aún no tienes estas páginas
export class LoginPage {
  static render() {
    alert("LoginPage no implementada");
  }
}

export class SignupPage {
  static render() {
    alert("SignupPage no implementada");
  }
}

class App {
  constructor() {
    this.routes = {
      inicio: () => InicioPage.render(),
      graymayas: () => CatalogoPage.render("graymayas", "Graymayas"),
      basicos: () => CatalogoPage.render("basicos", "Básicos"),
      accesorios: () => CatalogoPage.render("accesorios", "Accesorios"),
      colaboraciones: () =>
        CatalogoPage.render("colaboraciones", "Colaboraciones"),
      login: () => LoginPage.render(),
      signup: () => SignupPage.render(),
      "panel-control": () => this.accessPanelControl(),
    };
  }

  /**
   * Valida acceso al panel de control.
   * Si el usuario no es admin, redirige a inicio.
   * Si es admin pero no tiene sesión válida, muestra modal de login.
   */
  async accessPanelControl() {
    // Verificar si hay usuario logueado
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser || !currentUser.usuario) {
      // No hay usuario logueado, redirigir a inicio
      this.navigateTo("inicio");
      return;
    }

    // Verificar si es administrador
    const isAdmin = await AdminAuth.checkIfAdmin();

    if (!isAdmin) {
      // No es admin, redirigir a inicio
      this.navigateTo("inicio");
      return;
    }

    // Es admin, verificar si ya tiene sesión admin válida
    const adminSession = AdminAuth.getAdminSession();

    if (adminSession) {
      // Ya tiene sesión válida, mostrar panel
      PanelControlPage.render();
    } else {
      // Necesita validar con contraseña
      AdminLoginModal.show(() => {
        // Callback: después de validar exitosamente, mostrar panel
        PanelControlPage.render();
      });
    }
  }

  navigateTo(page) {
    window.history.pushState({}, "", `#${page}`);

    // Actualizar navbar activo
    document.querySelectorAll(".nav-link-custom").forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("data-page") === page) link.classList.add("active");
    });

    // Cerrar navbar en móvil
    const navbarCollapse = document.getElementById("navbarNav");
    if (navbarCollapse && navbarCollapse.classList.contains("show"))
      navbarCollapse.classList.remove("show");

    // Renderizar página
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
    } catch (_) {}

    window.scrollTo(0, 0);
  }

  /**
   * Actualiza la visibilidad del link del panel de control.
   * Solo muestra si el usuario es administrador.
   */
  async updateAdminLinkVisibility() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const panelLink = document.querySelector('[data-page="panel-control"]');

      if (!panelLink) return;

      if (!currentUser || !currentUser.usuario) {
        // No hay usuario, ocultar link
        panelLink.style.display = "none";
        return;
      }

      // Verificar si es admin
      const isAdmin = await AdminAuth.checkIfAdmin();
      const hasAdminSession = AdminAuth.getAdminSession() !== null;
      panelLink.style.display = isAdmin ? "" : "none";

      // Si está en el panel pero perdió permisos o sesión admin, salir
      if (pageIsPanel() && (!isAdmin || !hasAdminSession)) {
        this.navigateTo("inicio");
      }
    } catch (error) {
      console.error("Error checking admin visibility:", error);
    }
  }

  init() {
    document.addEventListener("DOMContentLoaded", async () => {
      // Cargar referencias al inicio (no bloquear)
      References.loadReferences().catch((err) =>
        console.warn("Referencias no disponibles:", err)
      );

      Cart.updateCounter();

      // Configurar listeners para navegación
      document.querySelectorAll("[data-page]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.navigateTo(link.getAttribute("data-page"));
        });
      });

      // Actualizar visibilidad del panel admin
      await this.updateAdminLinkVisibility();

      // Escuchar cambios en localStorage para actualizar visibilidad
      window.addEventListener("storage", async () => {
        await this.updateAdminLinkVisibility();
      });

      // Instrumentar setItem/removeItem para disparar evento local en esta pestaña
      const _set = localStorage.setItem.bind(localStorage);
      const _remove = localStorage.removeItem.bind(localStorage);
      localStorage.setItem = (k, v) => {
        _set(k, v);
        if (k === "currentUser" || k === "adminSession") {
          window.dispatchEvent(
            new CustomEvent("auth-change", { detail: { key: k } })
          );
        }
      };
      localStorage.removeItem = (k) => {
        _remove(k);
        if (k === "currentUser" || k === "adminSession") {
          window.dispatchEvent(
            new CustomEvent("auth-change", { detail: { key: k } })
          );
        }
      };

      window.addEventListener("auth-change", async () => {
        await this.updateAdminLinkVisibility();
      });

      // Navegación inicial
      const hash = window.location.hash.slice(1);
      this.navigateTo(hash || "inicio");

      // Escuchar cambios en el historial
      window.addEventListener("popstate", () => {
        const h = window.location.hash.slice(1);
        this.navigateTo(h || "inicio");
      });
    });
  }
}

const app = new App();

// Proxies globales (compatibilidad onclick inline)
window.app = app;
window.API = API;
window.Cart = Cart;
window.CatalogoPage = CatalogoPage;
window.PedidosAdmin = PedidosAdmin;
window.ProductsAdmin = ProductsAdmin;
window.ColaboradoresAdmin = ColaboradoresAdmin;
window.ClientesAdmin = ClientesAdmin;
window.AdminAuth = AdminAuth;

// Helper local
function pageIsPanel() {
  return window.location.hash === "#panel-control";
}

window.agregarAlCarrito = (id) => Cart.agregarAlCarrito(id);
window.toggleCarrito = (e) => Cart.toggleCarrito(e);
window.toggleMiCuenta = (e) => Cart.toggleMiCuenta(e);
window.cerrarPaneles = () => Cart.cerrarPaneles();
window.cambiarCantidad = (id, c) => Cart.cambiarCantidad(id, c);
window.eliminarDelCarrito = (id) => Cart.eliminarDelCarrito(id);

window.openProductForm = (id) => ProductsAdmin.openProductForm(id);
window.deleteProduct = (id) => ProductsAdmin.deleteProduct(id);

window.openClienteForm = (id) => ClientesAdmin.openClienteForm(id);
window.deleteCliente = (id) => ClientesAdmin.deleteCliente(id);

window.openPedidoForm = (id) => PedidosAdmin.openPedidoForm(id);
window.viewPedidoDetalles = (id) => PedidosAdmin.viewPedidoDetalles(id);
window.deletePedido = (id) => PedidosAdmin.deletePedido(id);

// Configurar productos destacados en la página de inicio
// IDs solicitados: 5,6,7,8,9,10
InicioPage.destacadosIds = [5, 6, 7, 8, 9, 10];

app.init();
