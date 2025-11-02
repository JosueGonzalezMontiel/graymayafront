// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDh0CCvBX_-CIcpau8Mug4_VaPwG4NTFKw",
  authDomain: "graym-eda2c.firebaseapp.com",
  projectId: "graym-eda2c",
  storageBucket: "graym-eda2c.firebasestorage.app",
  messagingSenderId: "957485502588",
  appId: "1:957485502588:web:670ccef9a9d066d7f3b9f9",
  measurementId: "G-32H8ZLTJGX",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
//export const analytics = getAnalytics(app);
export const auth = getAuth(app);
