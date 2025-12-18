import { BACKEND_URL } from "../../../config.js";

// -------------------------------------------------------------
// ELEMENTOS DEL DOM
// -------------------------------------------------------------
const seccionUsuario = document.getElementById("seccion-usuario");
const seccionDomicilio = document.getElementById("seccion-domicilio");
const btnSiguiente = document.getElementById("btn-siguiente");
const btnAnterior = document.getElementById("btn-anterior");
const formularioUsuario = document.getElementById("formulario-usuario");

// -------------------------------------------------------------
// MODAL
// -------------------------------------------------------------
function crearModal(titulo, mensaje, tipo, callback = null) {
    const color = tipo === "success" ? "#28a745" : "#dc3545";
    const icono = tipo === "success" ? "fa-check-circle" : "fa-times-circle";

    const overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.style = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.65);
        backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center;
        z-index: 2000; opacity: 0; transition: opacity .25s ease;
    `;

    const card = document.createElement("div");
    card.style = `
        background: white; padding: 35px; width: 90%; max-width: 380px;
        border-radius: 18px; text-align: center;
        transform: scale(0.8); transition: transform .25s ease;
        font-family: 'Poppins';
    `;

    card.innerHTML = `
        <i class="fas ${icono}" style="font-size: 60px; color: ${color}; margin-bottom: 15px;"></i>
        <h2 style="margin-bottom:10px; font-size:22px; font-weight:700;">${titulo}</h2>
        <p style="font-size:16px; margin-bottom:20px; color:#555;">${mensaje}</p>
        <button id="modal-cerrar" class="btn-rojo"
            style="padding:10px 20px; width:100%; border-radius:12px; font-size:16px;">
            Aceptar
        </button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = "1";
        card.style.transform = "scale(1)";
    }, 10);

    const cerrar = () => {
        overlay.style.opacity = "0";
        card.style.transform = "scale(0.8)";
        setTimeout(() => overlay.remove(), 250);
        if (callback) callback();
    };

    document.getElementById("modal-cerrar").onclick = cerrar;
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cerrar();
    });
}

// -------------------------------------------------------------
// PASO SIGUIENTE / ANTERIOR
// -------------------------------------------------------------
btnSiguiente.addEventListener("click", () => {
    const requeridos = seccionUsuario.querySelectorAll("input[required]");

    for (let input of requeridos) {
        if (!input.value.trim()) {
            input.reportValidity();
            return;
        }
    }

    seccionUsuario.classList.remove("activa");
    seccionDomicilio.classList.add("activa");
    
    scrollTo({ top: 0, behavior: "smooth" });
});

btnAnterior.addEventListener("click", () => {
    seccionDomicilio.classList.remove("activa");
    seccionUsuario.classList.add("activa");
    scrollTo({ top: 0, behavior: "smooth" });
});

// -------------------------------------------------------------
// SUBIR FOTO PERFIL
// -------------------------------------------------------------
const inputLogo = document.getElementById("archivoLogo");
const btnSubir = document.querySelector(".btn-subir");
const imgPreview = document.querySelector(".logo-previo");
const spanFalso = document.querySelector(".input-falso");

if (inputLogo) {
    btnSubir.addEventListener("click", () => inputLogo.click());

    inputLogo.addEventListener("change", () => {
        const file = inputLogo.files[0];
        if (!file) return;

        if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
            crearModal("Formato inválido", "Solo se permiten imágenes JPG o PNG.", "error");
            inputLogo.value = "";
            return;
        }

        spanFalso.textContent =
            file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name;

        const reader = new FileReader();
        reader.onload = (e) => (imgPreview.src = e.target.result);
        reader.readAsDataURL(file);
    });
}

// -------------------------------------------------------------
// REGISTRAR USUARIO (POST AL BACKEND)
// -------------------------------------------------------------
async function registrarUsuario(event) {
    event.preventDefault(); // evita que el form recargue la página

    // Tomar datos del formulario
    try {
        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const dni = parseInt(document.getElementById("dni").value.trim());
        const email = document.getElementById("email").value.trim();
        const provincia = document.getElementById("provincia").value.trim();
        const departamento = document.getElementById("departamento").value.trim();
        const localidad = document.getElementById("localidad").value.trim();
        const calle = document.getElementById("calle").value.trim();
        const altura = document.getElementById("altura").value.trim();
        const lat = parseFloat(document.getElementById("lat").value);
        const lng = parseFloat(document.getElementById("lng").value);
        const aclaracion = document.getElementById("datos_adicionales").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const password = document.getElementById("clave").value.trim();

        const direccionObj = {
            calle: calle,
            altura: altura,
            localidad: localidad,
            departamento: departamento,
            provincia: provincia,
            pais: "Argentina",
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            aclaracion: aclaracion,
        };

        const payload = {
            dni: dni,
            apellido: apellido,
            nombre: nombre,
            email: email,
            password: password,
            telefonos: [parseInt(telefono)],
            direcciones: [direccionObj],
        };

        const respuesta = await fetch(`${BACKEND_URL}/users/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            crearModal("Error en el registro", data.detail, "error");
            return;
        }

        // Si llegamos acá → registro OK y cookie creada

        // Redirigir al panel
        window.location.href = "../home-usuario/home-usuario.html";

    } catch (error) {
        console.error("Error inesperado:", error);
        crearModal("Error inesperado", "Ocurrió un error inesperado en el registro.", "error");
    }
}

// -------------------------------------------------------------
// CONECTAR FORMULARIO
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    formularioUsuario.addEventListener("submit", registrarUsuario);
});
