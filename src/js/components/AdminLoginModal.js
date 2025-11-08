import { AdminAuth } from "../services/adminAuth.js";
import { notificaciones } from "../utils/notificaciones.js";

/**
 * Componente modal para autenticación en panel administrativo.
 * Requiere usuario y contraseña antes de acceder.
 */
export class AdminLoginModal {
  /**
   * Muestra el modal de login administrativo.
   *
   * @param {Function} onSuccess - Callback cuando se valida exitosamente
   */
  static show(onSuccess = null) {
    // Verificar si ya existe un modal abierto
    let modal = document.getElementById("adminLoginModal");

    if (modal) {
      modal.remove();
    }

    modal = document.createElement("div");
    modal.id = "adminLoginModal";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.setAttribute("data-bs-backdrop", "static");
    modal.setAttribute("data-bs-keyboard", "false");
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content login-modal-content">
          <div class="modal-header border-0 pb-0">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <div class="text-center mb-4">
              <i class="bi bi-shield-lock" style="font-size: 3rem; color: #00b09b;"></i>
            </div>
            <h3 class="text-center mb-2" style="color: #020202;">Panel de Control Administrativo</h3>
            <p class="text-center text-muted mb-4" style="color: #666;">Por favor ingresa tus credenciales de administrador</p>

            <form id="adminLoginForm">
              <div class="mb-3">
                <label for="adminUsuario" class="form-label" style="color: #020202;">Usuario</label>
                <input 
                  type="text" 
                  class="form-control form-control-dark" 
                  id="adminUsuario" 
                  placeholder="Ingresa tu usuario"
                  autocomplete="username"
                  style="background-color: #f0f0f0; border: 1px solid #ddd; color: #020202;"
                  required
                >
              </div>

              <div class="mb-4">
                <label for="adminPassword" class="form-label" style="color: #020202;">Contraseña del Panel</label>
                <input 
                  type="password" 
                  class="form-control form-control-dark" 
                  id="adminPassword" 
                  placeholder="Ingresa la contraseña del panel"
                  autocomplete="current-password"
                  style="background-color: #f0f0f0; border: 1px solid #ddd; color: #020202;"
                  required
                >
                <small style="color: #999; display: block; margin-top: 0.5rem;">
                  Esta es la contraseña del panel administrativo, no tu contraseña de usuario.
                </small>
              </div>

              <button 
                type="submit" 
                class="btn btn-gradient w-100"
                style="margin-bottom: 0.75rem;"
              >
                <i class="bi bi-box-arrow-in-right me-2"></i>Acceder al Panel
              </button>

              <button 
                type="button" 
                class="btn btn-outline-secondary w-100"
                data-bs-dismiss="modal"
              >
                Cancelar
              </button>
            </form>

            <div class="alert alert-info mt-3" style="font-size: 0.85rem; background-color: #e7f3ff; border: 1px solid #b3d9ff; color: #004085;">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Solo administradores</strong> pueden acceder a esta sección.
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listener para el formulario
    const form = modal.querySelector("#adminLoginForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = document.getElementById("adminUsuario").value.trim();
      const password = document.getElementById("adminPassword").value;

      // Desabilitar botón mientras se valida
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Validando...
      `;

      try {
        const isValid = await AdminAuth.validateAdminAccess(usuario, password);

        if (isValid) {
          // Cerrar modal
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();

          // Esperar a que se cierre la animación
          setTimeout(() => {
            if (modal.parentNode) {
              modal.remove();
            }

            // Ejecutar callback si existe
            if (onSuccess && typeof onSuccess === "function") {
              onSuccess();
            }
          }, 300);
        }
      } catch (error) {
        console.error("Error en login admin:", error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Enfocar en campo de usuario
    document.getElementById("adminUsuario").focus();
  }

  /**
   * Valida si el usuario tiene acceso sin mostrar modal.
   * Útil para decidir si mostrar el link del panel.
   */
  static async canAccessPanel() {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      if (!currentUser || !currentUser.usuario) {
        return false;
      }

      return await AdminAuth.checkIfAdmin();
    } catch (error) {
      console.error("Error checking panel access:", error);
      return false;
    }
  }
}

window.AdminLoginModal = AdminLoginModal;
