export class Utils {
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
