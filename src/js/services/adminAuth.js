import { API } from "../api/apiClient.js";
import { notificaciones } from "../utils/notificaciones.js";

/**
 * Servicio para validación de acceso al panel administrativo.
 * Maneja autenticación y almacenamiento de sesión admin.
 */
export class AdminAuth {
  constructor() {
    // CAMBIO DE SEGURIDAD: Usar sessionStorage en lugar de localStorage
    // sessionStorage se borra al cerrar la pestaña
    this.storageKey = "admin_session";
    this.storage = sessionStorage; // Cambio crítico
    this.authToken = null; // Token en memoria
  }

  /**
   * Verifica si el usuario actual es administrador.
   * Consulta el backend para obtener el estado más reciente.
   */
  static async checkIfAdmin() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      if (!currentUser || !currentUser.usuario) {
        return false;
      }

      const response = await API.fetch(
        `/admin/check-admin/${currentUser.usuario}`
      );
      return response.is_admin === true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }

  /**
   * Obtiene la sesión admin del sessionStorage si existe y es válida.
   */
  static getAdminSession() {
    try {
      const session = sessionStorage.getItem("admin_session");
      if (!session) return null;

      const parsed = JSON.parse(session);

      // Validar contra el usuario actual
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (
        !currentUser ||
        !currentUser.usuario ||
        parsed.usuario !== currentUser.usuario
      ) {
        sessionStorage.removeItem("admin_session");
        return null;
      }

      // Expiración: 30 minutos
      const MAX_AGE_MS = 30 * 60 * 1000;
      if (parsed.timestamp && Date.now() - parsed.timestamp > MAX_AGE_MS) {
        sessionStorage.removeItem("admin_session");
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error parsing admin session:", error);
      return null;
    }
  }

  /**
   * Valida acceso al panel administrativo.
   * Requiere usuario y contraseña del panel.
   *
   * @param {string} usuario - Nombre de usuario
   * @param {string} password - Contraseña del panel administrativo
   * @returns {Promise<boolean>} True si acceso fue concedido
   */
  static async validateAdminAccess(usuario, password) {
    try {
      if (!usuario || !password) {
        notificaciones("Por favor completa todos los campos", "warning");
        return false;
      }

      const response = await API.fetch("/admin/validate-access", {
        method: "POST",
        body: JSON.stringify({
          usuario: usuario.trim(),
          password: password.trim(),
        }),
      });

      if (response.access_granted) {
        // CAMBIO DE SEGURIDAD: Guardar en sessionStorage con datos mínimos
        sessionStorage.setItem(
          "admin_session",
          JSON.stringify({
            usuario: response.usuario,
            nombre: response.nombre,
            timestamp: Date.now(),
          })
        );

        notificaciones("¡Bienvenido al panel administrativo!");
        return true;
      }

      return false;
    } catch (error) {
      const errorMsg = error.message || "Error validando acceso";

      // Mensajes específicos según el error
      if (error.message.includes("403")) {
        if (error.message.includes("Contraseña")) {
          notificaciones("Contraseña de panel incorrecta", "error");
        } else if (error.message.includes("permisos")) {
          notificaciones("No tienes permisos de administrador", "error");
        } else {
          notificaciones("Acceso denegado", "error");
        }
      } else if (error.message.includes("404")) {
        notificaciones("Usuario no encontrado", "error");
      } else {
        notificaciones("Error: " + errorMsg, "error");
      }

      return false;
    }
  }

  /**
   * Cierra la sesión administrativa.
   */
  static logoutAdmin() {
    sessionStorage.removeItem("admin_session");
    notificaciones("Sesión administrativa cerrada");
  }

  /**
   * Verifica si hay una sesión admin activa válida.
   */
  static isAdminLoggedIn() {
    return this.getAdminSession() !== null;
  }

  isAuthenticated() {
    try {
      const session = this.storage.getItem(this.storageKey);
      if (!session) return false;

      const data = JSON.parse(session);

      // CAMBIO DE SEGURIDAD: Expirar sesión después de 30 minutos
      const MAX_SESSION_TIME = 30 * 60 * 1000; // 30 minutos
      if (Date.now() - data.timestamp > MAX_SESSION_TIME) {
        this.logout();
        return false;
      }

      return !!data.admin_id && !!this.authToken;
    } catch {
      return false;
    }
  }

  logout() {
    this.storage.removeItem(this.storageKey);
    this.authToken = null; // Limpiar token de memoria
  }

  getAuthHeader() {
    // El token se envía en headers, NO se almacena en storage
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }
}

window.AdminAuth = AdminAuth;
