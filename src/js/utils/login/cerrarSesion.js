import { signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../notificaciones.js";

// Exponer función global para ser llamada desde el onclick en index.html
window.cerrarSesion = async function () {
  try {
    await signOut(auth);
    console.log("Sesión cerrada...");

    // Limpiar datos del usuario en localStorage
    localStorage.removeItem("currentUser");
    localStorage.removeItem("usuario");
    console.log("Datos de usuario eliminados de localStorage");

    notificaciones("Sesión cerrada correctamente");

    // Redirigir a inicio después de cerrar sesión
    if (window.app && typeof window.app.navigateTo === "function") {
      window.app.navigateTo("inicio");
    } else {
      window.location.hash = "#inicio";
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
  }
};
