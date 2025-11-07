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
      "panel-control": () => PanelControlPage.render(),
    };
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

    // Renderizar
    if (this.routes[page]) this.routes[page]();
    else this.routes.inicio();
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

  init() {
    document.addEventListener("DOMContentLoaded", async () => {
      // Cargar referencias al inicio (no bloquear)
      References.loadReferences().catch((err) =>
        console.warn("Referencias no disponibles:", err)
      );

      Cart.updateCounter();
      document.querySelectorAll("[data-page]").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          this.navigateTo(link.getAttribute("data-page"));
        });
      });
      const hash = window.location.hash.slice(1);
      this.navigateTo(hash || "inicio");
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

app.init();
