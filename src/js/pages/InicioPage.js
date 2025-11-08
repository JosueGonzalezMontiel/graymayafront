import { Utils } from "../utils/utils.js";
import { productosData } from "../utils/productosData.js";

export class InicioPage {
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
        window.app.navigateTo(page); // ← Agregar window.
      });
    });

    // Ajustar altura del carrousel en móvil después de cargar imágenes
    InicioPage.ajustarAlturaCarousel();
  }
  //moviles
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
      } else {
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
