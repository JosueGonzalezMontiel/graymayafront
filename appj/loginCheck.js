const cerrarSesionLinks = document.querySelectorAll(".cerrarSesion");
const iniciarSesionLinks = document.querySelectorAll(".iniciarSesion");

export const logincheck = (user) => {
  if (user) {
    // Si hay usuario logueado: OCULTAR login/signup, MOSTRAR cerrar sesión
    cerrarSesionLinks.forEach((link) => (link.style.display = "none"));
    iniciarSesionLinks.forEach((link) => (link.style.display = "block"));
  } else {
    // Si NO hay usuario: MOSTRAR login/signup, OCULTAR cerrar sesión
    cerrarSesionLinks.forEach((link) => (link.style.display = "block"));
    iniciarSesionLinks.forEach((link) => (link.style.display = "none"));
  }
};
