export function notificaciones(message, type = "success") {
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
      background:
        type === "success"
          ? "linear-gradient(to right, #00b09b, #96c93d, #e7c6e0ff)"
          : "linear-gradient(to right, #ff5f6d, #ffc371)",
      borderRadius: "10px",
    },
    onClick: function () {}, // Callback after click
  }).showToast();
}
