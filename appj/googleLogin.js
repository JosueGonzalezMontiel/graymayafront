import {
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { notificaciones } from "../src/js/utils/notificaciones.js";

const googleButton = document.querySelector("#googleLogin");

googleButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const credentials = await signInWithPopup(auth, provider);
    const user = credentials.user;
    const modal = bootstrap.Modal.getInstance(
      document.querySelector("#loginModal")
    );
    modal.hide();
    notificaciones("Bienvenido a GRAYMAYA " + credentials.user.displayName);
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    notificaciones(
      "Error al iniciar sesión con Google: " + error.message,
      "error"
    );
  }
});
