import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../notificaciones.js";

// PÁGINA: Signup (como modal)
// ========================================
class SignupPage {
  static render() {
    // No reemplazar el #app, sino crear/mostrar un modal
    let modal = document.getElementById("signupModal");

    // Si el modal no existe, crearlo
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "signupModal";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content login-modal-content">
            <div class="modal-header border-0">
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
              <div class="text-center mb-3">
                <img src="public/img/icons/tarjetaIco.png" alt="Graymaya" style="height: 60px;">
              </div>
              <h2 class="login-title text-center mb-2">Bienvenido a Graymaya</h2>
              <p class="login-subtitle text-center">Crea una cuenta para continuar</p>
              <form id="signupForm">
                <div class="mb-3">
                  <label for="signupEmail" class="form-label">Email</label>
                  <input type="email" class="form-control form-control-dark" id="signupEmail" required>
                </div>
                <div class="mb-3">
                  <label for="signupPassword" class="form-label">Contraseña</label>
                  <input type="password" class="form-control form-control-dark" id="signupPassword" required>
                </div>
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="signupRemember">
                  <label class="form-check-label" for="signupRemember">Recordarme</label>
                </div>
                <div class="d-flex gap-3 justify-content-center">
                  <button type="submit" class="btn btn-gradient flex-fill">
                    Crear Cuenta
                  </button>
                  <button type="button" class="btn btn-gradient flex-fill d-flex align-items-center justify-content-center gap-2" id="googleSignupBtn">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width: 20px; height: 20px;">
                    Google
                  </button>
                </div>
              </form>
              <div class="text-center mt-3">
                <a href="#" class="text-muted" id="linkToLoginFromSignup">¿Ya tienes cuenta? Inicia sesión</a>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Configurar event listeners
    const form = modal.querySelector("#signupForm");
    if (form) {
      // Remover listeners anteriores
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        localStorage.setItem("usuario", JSON.stringify({ email, password }));

        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          if (userCredential) {
            notificaciones("Registro exitoso con " + userCredential.user.email);

            // Cerrar el modal de signup
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();

            // Abrir modal de completar perfil
            setTimeout(() => {
              SignupPage.showCompleteProfileModal(userCredential.user.email);
            }, 300);
          }
        } catch (error) {
          if (error.code === "auth/weak-password") {
            notificaciones(
              "La contraseña debe de tener mas de 6 caracteres.",
              "error"
            );
          } else if (error.code === "auth/email-already-in-use") {
            notificaciones(
              "El correo electrónico ya está en uso por otra cuenta.",
              "error"
            );
          } else if (error.code === "auth/invalid-email") {
            notificaciones("El correo electrónico no es válido.", "error");
          } else if (error.code === "auth/network-request-failed") {
            notificaciones(
              "Fallo de red. Por favor, verifica tu conexión a Internet.",
              "error"
            );
          } else if (error.code) {
            notificaciones("Algo salió mal: " + error.message, "error");
          }
        }
      });
    }

    // Botón de Google Signup
    const googleBtn = modal.querySelector("#googleSignupBtn");
    if (googleBtn) {
      googleBtn.onclick = async (e) => {
        e.preventDefault();
        const provider = new GoogleAuthProvider();
        try {
          const credentials = await signInWithPopup(auth, provider);
          notificaciones(
            "Bienvenido a GRAYMAYA " + credentials.user.displayName
          );

          // Cerrar el modal de signup
          const modalInstance = bootstrap.Modal.getInstance(modal);
          if (modalInstance) modalInstance.hide();

          // Abrir modal de completar perfil
          setTimeout(() => {
            SignupPage.showCompleteProfileModal(
              credentials.user.email,
              credentials.user.displayName
            );
          }, 300);
        } catch (error) {
          console.error("Error al registrarse con Google:", error);
          notificaciones(
            "Error al registrarse con Google: " + error.message,
            "error"
          );
        }
      };
    }

    // Link para abrir login
    const linkToLogin = modal.querySelector("#linkToLoginFromSignup");
    if (linkToLogin) {
      linkToLogin.onclick = (e) => {
        e.preventDefault();
        // Cerrar signup
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
        // Abrir login después de un pequeño delay
        setTimeout(() => {
          if (window.LoginPage) {
            window.LoginPage.render();
          }
        }, 300);
      };
    }

    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  // Modal para completar perfil después del registro en Firebase
  static showCompleteProfileModal(email, displayName = "") {
    let modal = document.getElementById("completeProfileModal");

    // Remover modal anterior si existe
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "completeProfileModal";
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.setAttribute("data-bs-backdrop", "static");
    modal.setAttribute("data-bs-keyboard", "false");
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content login-modal-content">
          <div class="modal-header border-0">
            <h5 class="modal-title w-100 text-center">Completa tu Perfil</h5>
          </div>
          <div class="modal-body p-4">
            <p class="text-center text-muted mb-4">Por favor completa los siguientes datos para finalizar tu registro</p>
            <form id="completeProfileForm">
              <div class="mb-3">
                <label for="profileEmail" class="form-label">Email</label>
                <input type="email" class="form-control form-control-dark" id="profileEmail" value="${email}" readonly>
              </div>
              <div class="mb-3">
                <label for="profileNombre" class="form-label">Nombre Completo *</label>
                <input type="text" class="form-control form-control-dark" id="profileNombre" value="${displayName}" required maxlength="100">
              </div>
              <div class="mb-3">
                <label for="profileUsuario" class="form-label">Usuario *</label>
                <input type="text" class="form-control form-control-dark" id="profileUsuario" required maxlength="50" placeholder="Nombre de usuario único">
              </div>
              <div class="mb-3">
                <label for="profileTelefono" class="form-label">Teléfono</label>
                <input type="tel" class="form-control form-control-dark" id="profileTelefono" maxlength="20" placeholder="Opcional">
              </div>
              <div class="mb-3">
                <label for="profileDireccion" class="form-label">Dirección (opcional)</label>
                <textarea class="form-control form-control-dark" id="profileDireccion" rows="2" maxlength="255" placeholder="Opcional"></textarea>
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-gradient">
                  Completar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const form = modal.querySelector("#completeProfileForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("profileNombre").value.trim();
      const usuario = document.getElementById("profileUsuario").value.trim();
      // Si el usuario deja estos campos vacíos, enviar cadenas vacías en lugar de null
      // para evitar errores en BD que no acepta NULL en columnas opcionales.
      const telefonoVal = document
        .getElementById("profileTelefono")
        .value.trim();
      const direccionVal = document
        .getElementById("profileDireccion")
        .value.trim();
      const telefono = telefonoVal === "" ? "" : telefonoVal;
      const direccion = direccionVal === "" ? "" : direccionVal;

      if (!nombre || !usuario) {
        notificaciones("Por favor completa los campos obligatorios", "error");
        return;
      }

      const payload = {
        nombre,
        telefono,
        email,
        direccion,
        usuario,
        password: "firebase_auth", // Placeholder ya que la auth real es con Firebase
        es_admin: false,
      };

      try {
        // UX: deshabilitar botón mientras se envía
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Guardando...";
        }
        // Usar la API global que ya existe en script.js
        const nuevoCliente = await window.API.createReference(
          "clientes",
          payload
        );
        notificaciones("Perfil completado exitosamente");

        // Guardar cliente en localStorage para el carrito
        localStorage.setItem("currentUser", JSON.stringify(nuevoCliente));
        console.log("Cliente guardado en localStorage:", nuevoCliente);

        // Cerrar modal
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
        modal.remove();

        // Navegar a inicio
        if (window.app && typeof window.app.navigateTo === "function") {
          window.app.navigateTo("inicio");
        } else {
          window.location.hash = "#inicio";
        }
      } catch (error) {
        console.error("Error al crear cliente:", error);
        // Mantener el modal abierto y mostrar mensaje de error sin cerrar ni navegar
        const msg =
          error && error.message && /409|unique|ya existe/i.test(error.message)
            ? "El usuario o email ya está en uso. Intenta con otro."
            : "El usuario o email ya está en uso. Intenta con otro.";
        notificaciones(msg, "error");
        // Foco en campo usuario si parece error de unicidad
        if (/unique|usuario|409|ya está en uso/i.test(msg)) {
          const userInput = document.getElementById("profileUsuario");
          if (userInput) userInput.focus();
        }
      } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "Completar Registro";
        }
      }
    });

    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }
}

// Hacer disponible globalmente para el router clásico en script.js
window.SignupPage = SignupPage;
