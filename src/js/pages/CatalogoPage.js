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
                        ${
                          categoria === "graymayas" || categoria === "basicos"
                            ? `
                        <button id="toggle_filters_${categoria}" class="btn btn-outline-light btn-sm" type="button">Más filtros</button>
                        <div id="filter_panel_${categoria}" class="filter-panel" style="display:none; align-items:center;">
                          <div class="filter-group">
                            <label class="form-label filter-label">Talla</label>
                            <select id="filter_talla_${categoria}" class="form-select form-select-sm">
                              <option value="todas">Todas</option>
                            </select>
                          </div>
                          <div class="filter-group">
                            <label class="form-label filter-label">Color</label>
                            <select id="filter_color_${categoria}" class="form-select form-select-sm">
                              <option value="todas">Todos</option>
                            </select>
                          </div>
                          <div class="filter-group">
                            <button id="reset_filters_${categoria}" class="btn btn-secondary btn-sm" type="button">Restablecer filtros</button>
                          </div>
                          <div id="filters_spinner_${categoria}" class="filter-spinner" style="display:none; margin-left:8px; align-self:center;">
                            <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div>
                          </div>
                        </div>
                        `
                            : ""
                        }
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
        // Leer selects de filtros (si existen)
        const tallaEl = document.getElementById(`filter_talla_${categoria}`);
        const colorEl = document.getElementById(`filter_color_${categoria}`);
        const selTalla = tallaEl ? tallaEl.value : "todas";
        const selColor = colorEl ? colorEl.value : "todas";
        CatalogoPage.filtrarProductos(
          categoria,
          categoriaFiltro,
          `productos${categoria}`,
          selTalla,
          selColor
        );
        // Repoblar filtros para la subcategoría activa (asegura tallas/colores relevantes)
        if (categoria === "graymayas" || categoria === "basicos") {
          CatalogoPage._showFilterSpinner(categoria, true);
          References.loadReferences()
            .then(() => {
              CatalogoPage._populateFiltersForCategory(
                categoria,
                window.productosCache || [],
                categoriaFiltro
              );
            })
            .catch(() => {
              CatalogoPage._populateFiltersForCategory(
                categoria,
                window.productosCache || [],
                categoriaFiltro
              );
            })
            .finally(() => {
              CatalogoPage._showFilterSpinner(categoria, false);
            });
        }
      });
    });
    // En móvil, cerrar el panel de filtros automáticamente
    try {
      if (window.innerWidth <= 576) {
        const panelEl = document.getElementById(`filter_panel_${categoria}`);
        const toggleEl = document.getElementById(`toggle_filters_${categoria}`);
        if (panelEl) panelEl.style.display = "none";
        if (toggleEl) toggleEl.textContent = "Más filtros";
      }
    } catch (err) {}

    // Handler para botón de restablecer filtros (si existe)
    if (categoria === "graymayas" || categoria === "basicos") {
      const resetBtn = document.getElementById(`reset_filters_${categoria}`);
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          const tallaEl = document.getElementById(`filter_talla_${categoria}`);
          const colorEl = document.getElementById(`filter_color_${categoria}`);
          if (tallaEl) tallaEl.value = "todas";
          if (colorEl) colorEl.value = "todas";
          const activeTab = document.querySelector(
            ".categoria-tabs .nav-link.active"
          );
          const sub = activeTab
            ? activeTab.getAttribute("data-categoria")
            : "todos";
          CatalogoPage.filtrarProductos(
            categoria,
            sub,
            `productos${categoria}`,
            "todas",
            "todas"
          );
          // En móvil, cerrar el panel de filtros automáticamente tras restablecer
          try {
            if (window.innerWidth <= 576) {
              const panelEl = document.getElementById(
                `filter_panel_${categoria}`
              );
              const toggleEl = document.getElementById(
                `toggle_filters_${categoria}`
              );
              if (panelEl) panelEl.style.display = "none";
              if (toggleEl) toggleEl.textContent = "Más filtros";
            }
          } catch (err) {}
        });
      }
      // toggle more filters panel
      const toggleBtn = document.getElementById(`toggle_filters_${categoria}`);
      const panel = document.getElementById(`filter_panel_${categoria}`);
      if (toggleBtn && panel) {
        toggleBtn.addEventListener("click", () => {
          const isOpen = panel.style.display && panel.style.display !== "none";
          if (isOpen) {
            panel.style.display = "none";
            toggleBtn.textContent = "Más filtros";
          } else {
            panel.style.display = "flex";
            toggleBtn.textContent = "Cerrar filtros";
          }
        });
      }
    }
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
    const talla_id = getVal(producto, ["talla_id", "talla"]) || null;

    const categoriasCache = cache?.categorias ?? [];
    const patronesCache = cache?.patrones ?? [];
    const tallasCache = cache?.tallas ?? [];

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

    const tallaObj = tallasCache.find((t) => t.talla_id === talla_id) || {};
    const tallaName =
      tallaObj.nombre ??
      tallaObj.nombre_talla ??
      tallaObj.label ??
      talla_id ??
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
    if (tallaName)
      detalles.push(
        `<div class="detail-item talla">Talla: ${Utils.escapeHtml(
          tallaName
        )}</div>`
      );
    const detallesHtml = detalles.length
      ? `<div class="product-details">${detalles.join("")}</div>`
      : "";

    return `
      <div class="col-md-4 col-lg-3">
        <div class="product-card ${!isActive ? "product-inactive" : ""}">
          <img src="${imagen}" alt="${Utils.escapeHtml(
      nombre
    )}" class="product-image">
          <div class="product-info">
            <h5 class="product-name">${Utils.escapeHtml(nombre)}</h5>
            <p class="product-description">${Utils.escapeHtml(descripcion)}</p>
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

        container.innerHTML = textoDescriptivo;

        // Renderizar en chunks para no bloquear el hilo principal
        CatalogoPage._initLazyImagesObserver();
        CatalogoPage._renderInChunks(productos, containerId, 24);

        // Si corresponde, forzar carga de referencias y luego poblar selects de filtros (talla/color)
        if (categoria === "graymayas" || categoria === "basicos") {
          CatalogoPage._showFilterSpinner(categoria, true);
          References.loadReferences()
            .then(() => {
              CatalogoPage._populateFiltersForCategory(categoria, productos);
            })
            .catch(() => {
              // aunque falle la carga, intentar poblar con lo disponible
              CatalogoPage._populateFiltersForCategory(categoria, productos);
            })
            .finally(() => {
              CatalogoPage._showFilterSpinner(categoria, false);
            });
        }
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
        if (categoria === "graymayas" || categoria === "basicos") {
          CatalogoPage._showFilterSpinner(categoria, true);
          References.loadReferences()
            .then(() => {
              CatalogoPage._populateFiltersForCategory(categoria, productos);
            })
            .catch(() => {
              CatalogoPage._populateFiltersForCategory(categoria, productos);
            })
            .finally(() => {
              CatalogoPage._showFilterSpinner(categoria, false);
            });
        }
      });
  }
  static _resolveTallaNameFromProduct(producto) {
    const tallasCache = cache?.tallas ?? [];
    const talla_id = producto.talla_id ?? producto.talla ?? null;
    const tallaObj = tallasCache.find((t) => t.talla_id === talla_id) || {};
    const tallaName =
      tallaObj.nombre ??
      tallaObj.nombre_talla ??
      tallaObj.label ??
      (typeof talla_id === "string" ? talla_id : null) ??
      null;
    return tallaName ? String(tallaName).trim() : null;
  }

  static _showFilterSpinner(categoria, show) {
    try {
      const el = document.getElementById(`filters_spinner_${categoria}`);
      if (!el) return;
      el.style.display = show ? "inline-block" : "none";
    } catch (err) {
      // ignore
    }
  }

  static _populateFiltersForCategory(categoria, productos, sub = "todos") {
    try {
      const tallaSelect = document.getElementById(`filter_talla_${categoria}`);
      const colorSelect = document.getElementById(`filter_color_${categoria}`);

      if (!tallaSelect && !colorSelect) return;

      // Filtrar productos según subcategoría si se indicó
      let productosConsiderados = Array.isArray(productos)
        ? productos.slice()
        : [];
      if (sub && sub !== "todos") {
        const filterMap = CATEGORY_FILTER_MAP[categoria] || {};
        const filterIds = filterMap[sub] || [];
        if (filterIds.length > 0) {
          productosConsiderados = productosConsiderados.filter((p) => {
            const pid = p.categoria_id ?? p.categoria ?? null;
            return filterIds.includes(Number(pid));
          });
        }
      }

      // Recolectar tallas y colores únicos y sus conteos
      const tallasSet = new Set();
      const colorsSet = new Set();
      const tallasCount = new Map();
      const colorsCount = new Map();

      productosConsiderados.forEach((p) => {
        const t = CatalogoPage._resolveTallaNameFromProduct(p);
        if (t) {
          tallasSet.add(t);
          tallasCount.set(t, (tallasCount.get(t) || 0) + 1);
        }
        const c = (p.color ?? "").toString().trim();
        if (c) {
          colorsSet.add(c);
          colorsCount.set(c, (colorsCount.get(c) || 0) + 1);
        }
      });

      // Poblar tallas
      if (tallaSelect) {
        // preservar selección actual si existe
        const prevTalla = tallaSelect.value;
        tallaSelect.innerHTML = `<option value="todas">Todas</option>`;
        Array.from(tallasSet)
          .sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
          )
          .forEach((t) => {
            const opt = document.createElement("option");
            opt.value = t;
            const count = tallasCount.get(t) || 0;
            opt.textContent = `${t} (${count})`;
            tallaSelect.appendChild(opt);
          });

        // Restaurar selección previa si todavía existe
        if (prevTalla && tallasSet.has(prevTalla)) {
          tallaSelect.value = prevTalla;
        } else {
          tallaSelect.value = "todas";
        }

        // Reemplazar handler anterior si existe
        tallaSelect.onchange = (e) => {
          const selTalla = e.target.value;
          const selColorEl = document.getElementById(
            `filter_color_${categoria}`
          );
          const selColor = selColorEl ? selColorEl.value : "todas";
          const activeTab = document.querySelector(
            ".categoria-tabs .nav-link.active"
          );
          const subAct = activeTab
            ? activeTab.getAttribute("data-categoria")
            : "todos";
          CatalogoPage.filtrarProductos(
            categoria,
            subAct,
            `productos${categoria}`,
            selTalla,
            selColor
          );
          // Repoblar complementary filters for the currently active subcategory
          CatalogoPage._populateFiltersForCategory(
            categoria,
            window.productosCache || [],
            subAct
          );
          // En móvil, cerrar el panel de filtros automáticamente
          try {
            if (window.innerWidth <= 576) {
              const panelEl = document.getElementById(
                `filter_panel_${categoria}`
              );
              const toggleEl = document.getElementById(
                `toggle_filters_${categoria}`
              );
              if (panelEl) panelEl.style.display = "none";
              if (toggleEl) toggleEl.textContent = "Más filtros";
            }
          } catch (err) {}
        };
      }

      // Poblar colores
      if (colorSelect) {
        const prevColor = colorSelect.value;
        colorSelect.innerHTML = `<option value="todas">Todos</option>`;
        Array.from(colorsSet)
          .sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
          )
          .forEach((c) => {
            const opt = document.createElement("option");
            opt.value = c;
            const count = colorsCount.get(c) || 0;
            opt.textContent = `${c} (${count})`;
            colorSelect.appendChild(opt);
          });

        // Restaurar selección previa si todavía existe
        if (prevColor && colorsSet.has(prevColor)) {
          colorSelect.value = prevColor;
        } else {
          colorSelect.value = "todas";
        }

        colorSelect.onchange = (e) => {
          const selColor = e.target.value;
          const selTallaEl = document.getElementById(
            `filter_talla_${categoria}`
          );
          const selTalla = selTallaEl ? selTallaEl.value : "todas";
          const activeTab = document.querySelector(
            ".categoria-tabs .nav-link.active"
          );
          const subAct = activeTab
            ? activeTab.getAttribute("data-categoria")
            : "todos";
          CatalogoPage.filtrarProductos(
            categoria,
            subAct,
            `productos${categoria}`,
            selTalla,
            selColor
          );
          // Repoblar complementary filters for the currently active subcategory
          CatalogoPage._populateFiltersForCategory(
            categoria,
            window.productosCache || [],
            subAct
          );
          // En móvil, cerrar el panel de filtros automáticamente
          try {
            if (window.innerWidth <= 576) {
              const panelEl = document.getElementById(
                `filter_panel_${categoria}`
              );
              const toggleEl = document.getElementById(
                `toggle_filters_${categoria}`
              );
              if (panelEl) panelEl.style.display = "none";
              if (toggleEl) toggleEl.textContent = "Más filtros";
            }
          } catch (err) {}
        };
      }
    } catch (err) {
      console.error("Error poblando filtros:", err);
    }
  }
  static filtrarProductos(
    categoria,
    filtro,
    containerId,
    tallaFilter = "todas",
    colorFilter = "todas"
  ) {
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

    // Aplicar filtro por talla si se indicó
    if (tallaFilter && tallaFilter !== "todas") {
      productosFiltrados = productosFiltrados.filter((p) => {
        const tName = CatalogoPage._resolveTallaNameFromProduct(p) || "";
        return (
          String(tName).toLowerCase() === String(tallaFilter).toLowerCase()
        );
      });
    }

    // Aplicar filtro por color si se indicó
    if (colorFilter && colorFilter !== "todas") {
      productosFiltrados = productosFiltrados.filter((p) => {
        const c = (p.color ?? "").toString().trim();
        return c.toLowerCase() === String(colorFilter).toLowerCase();
      });
    }

    // Renderizar productos filtrados
    // Renderizar resultados usando chunking (no bloquear UI)
    CatalogoPage._initLazyImagesObserver();
    if (!productosFiltrados || productosFiltrados.length === 0) {
      container.innerHTML =
        textoDescriptivo +
        `
        <div class="col-12">
          <div class="alert alert-info text-center">
            No se encontraron productos en esta categoría.
          </div>
        </div>
      `;
      return;
    }
    container.innerHTML = textoDescriptivo;
    CatalogoPage._renderInChunks(productosFiltrados, containerId, 24);
  }

  // Inicializa un IntersectionObserver para lazy-loading de imágenes
  static _initLazyImagesObserver() {
    try {
      if (this._lazyObserver) return;
      const options = { root: null, rootMargin: "200px", threshold: 0.01 };
      this._lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute("data-src");
            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
            }
            img.classList.remove("lazy");
            // Si dentro de un <picture> hay <source data-srcset>, asignarlas
            try {
              const pic = img.parentNode;
              if (pic && pic.tagName === "PICTURE") {
                const sources = pic.querySelectorAll("source[data-srcset]");
                sources.forEach((s) => {
                  const ds = s.getAttribute("data-srcset");
                  if (ds) {
                    s.srcset = ds;
                    s.removeAttribute("data-srcset");
                  }
                });
              }
            } catch (err) {}
            try {
              this._lazyObserver.unobserve(img);
            } catch (err) {}
          }
        });
      }, options);
    } catch (err) {
      // ignore
    }
  }

  // Crea un elemento DOM para la tarjeta de producto (usa lazy image via data-src)
  static crearProductoCardElement(producto) {
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

    const getVal = (obj, keys) => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return null;
    };

    const categoria_id =
      getVal(producto, ["categoria_id", "categoria"]) || null;
    const patron_id = getVal(producto, ["patron_id", "patron"]) || null;
    const talla_id = getVal(producto, ["talla_id", "talla"]) || null;

    const categoriasCache = cache?.categorias ?? [];
    const patronesCache = cache?.patrones ?? [];
    const tallasCache = cache?.tallas ?? [];

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

    const tallaObj = tallasCache.find((t) => t.talla_id === talla_id) || {};
    const tallaName =
      tallaObj.nombre ??
      tallaObj.nombre_talla ??
      tallaObj.label ??
      talla_id ??
      "";

    const col = document.createElement("div");
    col.className = "col-md-4 col-lg-3";

    const card = document.createElement("div");
    card.className = `product-card ${!isActive ? "product-inactive" : ""}`;

    // Construir <picture> con <source type="image/webp"> (data-srcset) y <img data-src>
    const picture = document.createElement("picture");
    const sourceWebp = document.createElement("source");
    sourceWebp.type = "image/webp";
    // generar data-srcset usando los webp generados: baseName-<size>.webp
    try {
      const clean = String(imagen).split("?")[0];
      const lastSlash = clean.lastIndexOf("/");
      const dir = lastSlash !== -1 ? clean.substring(0, lastSlash) : "";
      const filename =
        lastSlash !== -1 ? clean.substring(lastSlash + 1) : clean;
      const dot = filename.lastIndexOf(".");
      const nameNoExt = dot !== -1 ? filename.substring(0, dot) : filename;
      const base = dir ? `${dir}/${nameNoExt}` : nameNoExt;
      const sizes = [400, 800, 1200];
      const srcset = sizes.map((s) => `${base}-${s}.webp ${s}w`).join(", ");
      sourceWebp.setAttribute("data-srcset", srcset);
    } catch (err) {
      // si falla, no ponemos srcset
    }

    const img = document.createElement("img");
    img.className = "product-image lazy";
    // placeholder in src, real image in data-src (fallback for browsers without webp)
    img.src = "/placeholder.svg?height=300&width=300";
    img.setAttribute("data-src", imagen);
    img.alt = Utils.escapeHtml(nombre);
    picture.appendChild(sourceWebp);
    picture.appendChild(img);

    const info = document.createElement("div");
    info.className = "product-info";
    info.innerHTML = `
      <h5 class="product-name">${Utils.escapeHtml(nombre)}</h5>
      <p class="product-description">${Utils.escapeHtml(descripcion)}</p>
    `;

    // detalles
    const detalles = document.createElement("div");
    detalles.className = "product-details";
    const detCat = document.createElement("div");
    detCat.className = "detail-item categoria";
    detCat.textContent = categoriaName;
    detalles.appendChild(detCat);
    if (patronName) {
      const detPat = document.createElement("div");
      detPat.className = "detail-item patron";
      detPat.textContent = `Patrón: ${patronName}`;
      detalles.appendChild(detPat);
    }
    if (tallaName) {
      const detTal = document.createElement("div");
      detTal.className = "detail-item talla";
      detTal.textContent = `Talla: ${tallaName}`;
      detalles.appendChild(detTal);
    }

    const precioP = document.createElement("p");
    precioP.className = "product-price";
    precioP.textContent = `$${precio}`;

    const stockP = document.createElement("p");
    stockP.className = `product-stock ${
      disponible ? "stock-disponible" : "stock-agotado"
    }`;
    stockP.textContent = !isActive
      ? "No Disponible"
      : stockVal
      ? "En Stock"
      : "Agotado";

    const btn = document.createElement("button");
    btn.className = "btn btn-add-cart";
    if (!disponible) btn.setAttribute("disabled", "");
    btn.setAttribute("onclick", `agregarAlCarrito(${id})`);
    btn.textContent = disponible ? "Agregar al Carrito" : "No Disponible";

    // assemble (append picture)
    card.appendChild(picture);
    card.appendChild(info);
    info.appendChild(detalles);
    info.appendChild(precioP);
    info.appendChild(stockP);
    info.appendChild(btn);
    col.appendChild(card);

    return col;
  }

  // Render products in chunks to avoid blocking the main thread
  static _renderInChunks(productos, containerId, chunkSize = 20) {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;
      let i = 0;
      const total = productos.length;

      const renderChunk = () => {
        const fragment = document.createDocumentFragment();
        let count = 0;
        while (i < total && count < chunkSize) {
          const prod = productos[i++];
          const el = CatalogoPage.crearProductoCardElement(prod);
          fragment.appendChild(el);
          count++;
        }
        container.appendChild(fragment);
        // observe lazy images inside container
        try {
          const imgs = container.querySelectorAll("img.lazy");
          imgs.forEach(
            (img) => this._lazyObserver && this._lazyObserver.observe(img)
          );
        } catch (err) {}

        if (i < total) {
          if (typeof requestIdleCallback === "function") {
            requestIdleCallback(renderChunk, { timeout: 200 });
          } else {
            setTimeout(renderChunk, 50);
          }
        }
      };

      renderChunk();
    } catch (err) {
      console.error("Error in _renderInChunks:", err);
      // fallback: render synchronously
      const container = document.getElementById(containerId);
      if (!container) return;
      const html = productos
        .map((p) => CatalogoPage.crearProductoCard(p))
        .join("");
      container.innerHTML += html;
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
