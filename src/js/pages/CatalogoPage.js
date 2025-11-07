// PÁGINA: Catálogo (todas las variantes de catálogo)
import { API } from "../api/apiClient.js";
import { Utils } from "../utils/utils.js";
import { MENU_CATEGORY_MAP, CATEGORY_FILTER_MAP } from "../utils/constants.js";
import { References } from "../api/references.js";
import { productosData } from "../utils/productosData.js";
import { cache } from "../utils/cache.js";

export class CatalogoPage {
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
  //filtros paginas inicio
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

    const categoriasCache = cache?.categorias ?? [];
    const patronesCache = cache?.patrones ?? [];

    const catObj =
      categoriasCache.find((c) => c.categoria_id === categoria_id) ||
      categoriasCache.find((c) => c.categoria_id === producto.categoria) ||
      {};
    const categoriaName =
      catObj.nombre ?? catObj.nombre_categoria ?? "Sin categoría";

    const patronObj =
      patronesCache.find((pt) => pt.patron_id === patron_id) || {};
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
  static filtrarProductos(categoria, filtro, containerId) {
    const textoDescriptivo = `
      <div class="col-12 mb-4">
        <div class="catalogo-text-panel">
          <p class="catalogo-text">${
            CatalogoPage.textosCategoria[categoria] ||
            "Explora nuestra colección exclusiva."
          }</p>
        </div>
      </div>
    `;

    const container = document.getElementById(containerId);
    if (!container) return;

    const items = window.productosCache || [];

    // Obtener IDs permitidos según el menú principal
    const allowedIds = MENU_CATEGORY_MAP[categoria] || [];

    // Filtrar por categoría principal
    let productosFiltrados = items.filter((p) => {
      const pid = p.categoria_id ?? p.categoria ?? null;
      if (pid === null || pid === undefined) return false;
      return allowedIds.includes(Number(pid));
    });

    // Si hay un filtro específico (no "todos"), aplicar subfiltrado
    if (filtro && filtro !== "todos") {
      const filterMap = CATEGORY_FILTER_MAP[categoria] || {};
      const filterIds = filterMap[filtro] || [];

      if (filterIds.length > 0) {
        productosFiltrados = productosFiltrados.filter((p) => {
          const pid = p.categoria_id ?? p.categoria ?? null;
          return filterIds.includes(Number(pid));
        });
      }
    }

    // Renderizar productos filtrados
    const productosHtml = productosFiltrados
      .map((p) => CatalogoPage.crearProductoCard(p))
      .join("");

    container.innerHTML = textoDescriptivo + productosHtml;

    // Si no hay productos, mostrar mensaje
    if (productosFiltrados.length === 0) {
      container.innerHTML += `
        <div class="col-12">
          <div class="alert alert-info text-center">
            No se encontraron productos en esta categoría.
          </div>
        </div>
      `;
    }
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
