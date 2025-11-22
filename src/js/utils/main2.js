import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./login/firebase.js";
import { logincheck } from "./login/loginCheck.js";

import "./login/signup.js";
import "./login/cerrarSesion.js";
import "./login/login.js";

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
        // CAMBIO DE SEGURIDAD: Solo guardar datos esenciales NO sensibles
        const currentUser = localStorage.getItem("currentUser");
        const userData = {
          cliente_id: clienteExistente.cliente_id,
          email: clienteExistente.email,
          nombre: clienteExistente.nombre,
          // NO guardar: teléfono, dirección, historial de compras, etc.
        };

        if (
          !currentUser ||
          JSON.parse(currentUser).cliente_id !== clienteExistente.cliente_id
        ) {
          localStorage.setItem("currentUser", JSON.stringify(userData));
          console.log("Usuario sincronizado en localStorage:");
        }
      }
    } catch (error) {
      console.error("Error al sincronizar usuario:");
    }
  } else {
    // Usuario no autenticado, limpiar localStorage
    localStorage.removeItem("currentUser");
  }
});
