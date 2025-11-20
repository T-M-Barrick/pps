import {BACKEND_URL} from "../../config.js";

document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosDesdeBackend();
});


// ========================================
// 🔹 Pide /me al backend y guarda datos
// ========================================
async function cargarDatosDesdeBackend() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/users/me`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.error("No se pudo obtener los datos del usuario.");
            window.location.href = "/index.html";
            return;
        }

        const data = await respuesta.json();
        const usuario = data.usuario;

        // ---------------------------------
        // 1) Guardar datos del usuario
        // ---------------------------------
        sessionStorage.setItem("usuario", JSON.stringify({
            id: usuario.id,
            dni: usuario.dni,
            apellido: usuario.apellido,
            nombre: usuario.nombre,
            email: usuario.email,
            telefonos: usuario.telefonos,
            direcciones: usuario.direcciones
        }));

        // ---------------------------------
        // 2) Guardar favoritos separado
        // ---------------------------------
        sessionStorage.setItem("favoritos", JSON.stringify(usuario.favoritos));

        // ---------------------------------
        // 3) Guardar turnos separado
        // ---------------------------------
        sessionStorage.setItem("turnos", JSON.stringify(usuario.turnos));

        // Mostrar bienvenida
        mostrarBienvenida(usuario);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "/index.html";
    }
}


// ========================================
// 🔹 Mostrar “Bienvenido, Tomás”
// ========================================
function mostrarBienvenida(usuario) {
    const divBienvenida = document.getElementById("bienvenida");

    if (divBienvenida) {
        divBienvenida.textContent = `Bienvenido, ${usuario.nombre}`;
    }
}
