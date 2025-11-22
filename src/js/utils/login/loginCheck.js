const cerrarSesionLinks = document.querySelectorAll(".cerrarSesion");
const iniciarSesionLinks = document.querySelectorAll(".iniciarSesion");

export const logincheck = (user) => {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");

  if (user) {
    // CAMBIO DE SEGURIDAD: Validar datos antes de mostrar
    try {
      const storedUser = localStorage.getItem("currentUser");
      let displayName = user.email;

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Validar que los datos no estén manipulados
        if (userData.email === user.email && userData.nombre) {
          displayName = String(userData.nombre).substring(0, 50); // Limitar longitud
        }
      }

      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (userMenu) userMenu.style.display = "block";
      if (userName) {
        // CAMBIO DE SEGURIDAD: Escapar HTML antes de mostrar
        userName.textContent = displayName; // textContent en lugar de innerHTML
      }
    } catch (e) {
      console.error("Error al validar usuario:", e);
      // Si hay error, cerrar sesión por seguridad
      localStorage.removeItem("currentUser");
    }
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userMenu) userMenu.style.display = "none";
  }
};
