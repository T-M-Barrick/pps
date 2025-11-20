console.log("JS DEL REGISTRO CARGADO");

import {BACKEND_URL} from "../../config.js";
console.log("JS DEL REGISTRO CARGADO2");

async function registrarUsuario(event) {
    event.preventDefault(); // evita que el form recargue la página

    // 1) Tomar datos del formulario
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const dni = parseInt(document.getElementById("dni").value.trim());
    const email = document.getElementById("email").value.trim();
    const direccionTexto = document.getElementById("direccion").value.trim();
    const aclaracion = document.getElementById("datos_adicionales").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const password = document.getElementById("clave").value.trim();

    // 2) POR AHORA dirección sin geolocalización real
    // Cuando agregues el mapa, reemplazamos esto por lat/lng reales.
    const direccionObj = {
        domicilio: direccionTexto,
        lat: 0,      // ← LO CAMBIAREMOS CUANDO USEMOS GEOREF
        lng: 0,      // ← LO CAMBIAREMOS CUANDO USEMOS GEOREF
        aclaracion: aclaracion
    };

    // 3) El backend espera una lista de teléfonos y una lista de direcciones
    const payload = {
        dni: dni,
        apellido: apellido,
        nombre: nombre,
        email: email,
        password: password,
        telefonos: [parseInt(telefono)],
        direcciones: [direccionObj]
    };

    try {
        // 4) Enviar POST /users/
        console.log("Enviando POST /users/ con payload:", payload);
        const respuesta = await fetch(`${BACKEND_URL}/users/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // IMPORTANTE para recibir cookie
            body: JSON.stringify(payload)
        });
        console.log("Respuesta POST:", respuesta);

        const data = await respuesta.json();

        if (!respuesta.ok) {
            alert("Error: " + data.detail);
            return;
        }

        // Si llegamos acá → registro OK y cookie creada

        // 5) Obtener datos completos del usuario logueado
        console.log("Solicitando /users/me con cookies");
        const r2 = await fetch(`${BACKEND_URL}/users/me`, {
            method: "GET",
            credentials: "include" // envía la cookie al backend
        });
        console.log("Respuesta GET /users/me:", r2);

        const usuarioCompleto = await r2.json();

        if (!r2.ok) {
            alert("Error al obtener perfil del usuario");
            return;
        }

        // 6) Guardar el usuario en sessionStorage
        sessionStorage.setItem("usuario", JSON.stringify(usuarioCompleto));

        // 7) Redirigir al panel
        window.location.href = "/home-usuario.html";

    } catch (error) {
        console.error("Error inesperado:", error);
        alert("Hubo un error inesperado en el registro");
    }
}

// === CONECTAR FORMULARIO ===
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-registro");
    form.addEventListener("submit", registrarUsuario);
});