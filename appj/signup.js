import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../src/js/utils/notificaciones.js";

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

            // Cerrar el modal
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();

            // Navegar a inicio si no estamos ya allí
            if (window.app && typeof window.app.navigateTo === "function") {
              window.app.navigateTo("inicio");
            } else {
              window.location.hash = "#inicio";
            }
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

          // Cerrar el modal
          const modalInstance = bootstrap.Modal.getInstance(modal);
          if (modalInstance) modalInstance.hide();

          // Navegar a inicio
          if (window.app && typeof window.app.navigateTo === "function") {
            window.app.navigateTo("inicio");
          } else {
            window.location.hash = "#inicio";
          }
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
}

// Hacer disponible globalmente para el router clásico en script.js
window.SignupPage = SignupPage;
