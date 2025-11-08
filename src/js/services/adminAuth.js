import { API } from "../api/apiClient.js";
import { notificaciones } from "../utils/notificaciones.js";

/**
 * Servicio para validación de acceso al panel administrativo.
 * Maneja autenticación y almacenamiento de sesión admin.
 */
export class AdminAuth {
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
   * Obtiene la sesión admin del localStorage si existe y es válida.
   */
  static getAdminSession() {
    try {
      const session = localStorage.getItem("adminSession");
      if (!session) return null;

      const parsed = JSON.parse(session);

      // Validar contra el usuario actual
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (
        !currentUser ||
        !currentUser.usuario ||
        parsed.usuario !== currentUser.usuario
      ) {
        localStorage.removeItem("adminSession");
        return null;
      }

      // Expiración opcional: 2 horas
      const MAX_AGE_MS = 2 * 60 * 60 * 1000;
      if (parsed.timestamp && Date.now() - parsed.timestamp > MAX_AGE_MS) {
        localStorage.removeItem("adminSession");
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
        // Guardar sesión admin
        localStorage.setItem(
          "adminSession",
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
    localStorage.removeItem("adminSession");
    notificaciones("Sesión administrativa cerrada");
  }

  /**
   * Verifica si hay una sesión admin activa válida.
   */
  static isAdminLoggedIn() {
    return this.getAdminSession() !== null;
  }
}

window.AdminAuth = AdminAuth;
