import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./appj/firebase.js";
import { logincheck } from "./appj/logincheck.js";

import "./appj/signup.js";
import "./appj/cerrarSesion.js";
import "./appj/login.js";

onAuthStateChanged(auth, async (user) => {
  logincheck(user);

  if (user) {
    // Usuario autenticado con Firebase, verificar si existe en la base de datos
    try {
      const clientes = await window.API.fetch("/clientes?limit=200");
      const clienteExistente = clientes.items?.find(
        (c) => c.email === user.email
      );

      if (clienteExistente) {
        // Guardar cliente en localStorage si no existe o si es diferente
        const currentUser = localStorage.getItem("currentUser");
        if (
          !currentUser ||
          JSON.parse(currentUser).cliente_id !== clienteExistente.cliente_id
        ) {
          localStorage.setItem("currentUser", JSON.stringify(clienteExistente));
          console.log(
            "Usuario sincronizado en localStorage:",
            clienteExistente
          );
        }
      }
    } catch (error) {
      console.error("Error al sincronizar usuario:", error);
    }
  } else {
    // Usuario no autenticado, limpiar localStorage
    localStorage.removeItem("currentUser");
  }
});
