import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../notificaciones.js";

// PÁGINA: Login (como modal)
// ========================================
class LoginPage {
  static render() {
    // No reemplazar el #app, sino crear/mostrar un modal
    let modal = document.getElementById("loginModal");

    // Si el modal no existe, crearlo
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "loginModal";
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
              <p class="login-subtitle text-center">Inicia sesión para continuar</p>
              <form id="loginForm">
                <div class="mb-3">
                  <label for="loginEmail" class="form-label">Email</label>
                  <input type="email" class="form-control form-control-dark" id="loginEmail" required>
                </div>
                <div class="mb-3">
                  <label for="loginPassword" class="form-label">Contraseña</label>
                  <input type="password" class="form-control form-control-dark" id="loginPassword" required>
                </div>
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="loginRemember">
                  <label class="form-check-label" for="loginRemember">Recordarme</label>
                </div>
                <div class="d-flex gap-3 justify-content-center">
                  <button type="submit" class="btn btn-gradient flex-fill">
                    Iniciar Sesión
                  </button>
                  <button type="button" class="btn btn-gradient flex-fill d-flex align-items-center justify-content-center gap-2" id="googleLoginBtn">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style="width: 20px; height: 20px;">
                    Google
                  </button>
                </div>
              </form>
              <div class="text-center mt-3">
                <a href="#" class="text-muted">¿Olvidaste tu contraseña?</a>
              </div>
              <div class="text-center mt-3">
                <a href="#" class="text-muted" id="linkToSignupFromLogin">¿No tienes cuenta? Regístrate</a>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Configurar event listeners
    const form = modal.querySelector("#loginForm");
    if (form) {
      // Remover listeners anteriores
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        localStorage.setItem("usuario", JSON.stringify({ email, password }));

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          if (userCredential) {
            notificaciones(
              "Bienvenido a GRAYMAYA " + userCredential.user.email
            );

            // Cerrar el modal
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();

            // Obligar a revalidar el panel en cada nueva sesión
            localStorage.removeItem("adminSession");

            // Verificar si el usuario existe en la tabla clientes
            await LoginPage.checkAndCompleteProfile(userCredential.user.email);
          }
        } catch (error) {
          console.error("Error al iniciar sesión:", error.code);
          if (error.code === "auth/invalid-credential") {
            notificaciones("Usuario o contraseña es incorrecta.", "error");
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

    // Botón de Google Login
    const googleBtn = modal.querySelector("#googleLoginBtn");
    if (googleBtn) {
      googleBtn.onclick = async (e) => {
        e.preventDefault();
        const provider = new GoogleAuthProvider();
        try {
          const credentials = await signInWithPopup(auth, provider);
          notificaciones(
            "Bienvenido a GRAYMAYA " + credentials.user.displayName
          );

          // Cerrar el modal
          const modalInstance = bootstrap.Modal.getInstance(modal);
          if (modalInstance) modalInstance.hide();

          // Obligar a revalidar el panel en cada nueva sesión
          localStorage.removeItem("adminSession");

          // Verificar si el usuario existe en la tabla clientes
          await LoginPage.checkAndCompleteProfile(
            credentials.user.email,
            credentials.user.displayName
          );
        } catch (error) {
          console.error("Error al iniciar sesión con Google:", error);
          notificaciones(
            "Error al iniciar sesión con Google: " + error.message,
            "error"
          );
        }
      };
    }

    // Link para abrir signup
    const linkToSignup = modal.querySelector("#linkToSignupFromLogin");
    if (linkToSignup) {
      linkToSignup.onclick = (e) => {
        e.preventDefault();
        // Cerrar login
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();
        // Abrir signup después de un pequeño delay
        setTimeout(() => {
          if (window.SignupPage) {
            window.SignupPage.render();
          }
        }, 300);
      };
    }

    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
  }

  // Verificar si el usuario existe en clientes y mostrar modal si no
  static async checkAndCompleteProfile(email, displayName = "") {
    try {
      // Buscar cliente por email
      const clientes = await window.API.fetch("/clientes?limit=200");
      const clienteExistente = clientes.items?.find((c) => c.email === email);

      if (!clienteExistente) {
        // Usuario no existe en la tabla, mostrar modal de completar perfil
        setTimeout(() => {
          if (window.SignupPage && window.SignupPage.showCompleteProfileModal) {
            window.SignupPage.showCompleteProfileModal(email, displayName);
          }
        }, 300);
      } else {
        // Usuario existe, guardar en localStorage y navegar
        localStorage.setItem("currentUser", JSON.stringify(clienteExistente));

        // Actualizar visibilidad del panel admin en vivo
        if (
          window.app &&
          typeof window.app.updateAdminLinkVisibility === "function"
        ) {
          try {
            await window.app.updateAdminLinkVisibility();
          } catch (_) {}
        }

        if (window.app && typeof window.app.navigateTo === "function") {
          window.app.navigateTo("inicio");
        } else {
          window.location.hash = "#inicio";
        }
      }
    } catch (error) {
      console.error("Error al verificar cliente:", error);
      // En caso de error, permitir continuar
      if (window.app && typeof window.app.navigateTo === "function") {
        window.app.navigateTo("inicio");
      } else {
        window.location.hash = "#inicio";
      }
    }
  }
}

window.LoginPage = LoginPage;
