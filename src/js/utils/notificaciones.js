export function notificaciones(message, type = "success") {
  // Definir el color de fondo según el tipo
  let background;
  if (type === "success") {
    background = "linear-gradient(to right, #00b09b, #96c93d, #e7c6e0ff)";
  } else if (type === "error") {
    background = "linear-gradient(to right, #ff5f6d, #ffc371)";
  } else if (type === "warning") {
    background = "linear-gradient(to right, #f9ca24, #f0932b)";
  } else {
    // Default fallback
    background = "linear-gradient(to right, #00b09b, #96c93d, #e7c6e0ff)";
  }

  Toastify({
    text: message,
    duration: 3000,
    destination: "",
    newWindow: true,
    close: true,
    gravity: "top", // `top` or `bottom`
    position: "center", // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: {
      background: background,
      borderRadius: "10px",
    },
    onClick: function () {}, // Callback after click
  }).showToast();
}
