import { signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../src/js/utils/notificaciones.js";

// Exponer función global para ser llamada desde el onclick en index.html
window.cerrarSesion = async function () {
  try {
    await signOut(auth);
    console.log("Sesión cerrada...");

    notificaciones("Sesión cerrada correctamente");

    // Redirigir a login después de cerrar sesión
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
  }
};
