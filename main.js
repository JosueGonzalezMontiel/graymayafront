import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { auth } from "./appj/firebase.js";
import { logincheck } from "./appj/logincheck.js";

import "./appj/signup.js";
import "./appj/cerrarSesion.js";
import "./appj/login.js";

onAuthStateChanged(auth, async (user) => {
  logincheck(user);

  //   if (user) {
  // }else {
  //       logincheck(user)
  // }
});
