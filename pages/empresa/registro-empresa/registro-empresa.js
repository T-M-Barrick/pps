import { BACKEND_URL } from "../../../config.js";

const seccionEmpresa = document.getElementById("seccion-empresa");
const seccionDomicilio = document.getElementById("seccion-domicilio");
const btnSiguiente = document.getElementById("btn-siguiente");
const btnAnterior = document.getElementById("btn-anterior");
const formularioEmpresa = document.getElementById("formulario-empresa");

// -------------------------------------------------------------
// CONECTAR FORMULARIO
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    formularioEmpresa.addEventListener("submit", registrarEmpresa);
});

// -------------------------------------------------------------
// REGISTRAR EMPRESA (POST AL BACKEND)
// -------------------------------------------------------------
async function registrarEmpresa(event) {
    event.preventDefault(); // evita que el form recargue la página

    // Tomar datos del formulario
    try {
        const nombre = document.getElementById("nombre").value.trim();
        const cuit = parseInt(document.getElementById("cuit").value.trim());
        const email = document.getElementById("email").value.trim();
        const rubro = document.getElementById("rubro").value.trim();
        const rubro2 = document.getElementById("rubro2").value.trim();
        const provincia = document.getElementById("provincia").value.trim();
        const departamento = document.getElementById("departamento").value.trim();
        const localidad = document.getElementById("localidad").value.trim();
        const calle = document.getElementById("calle").value.trim();
        const altura = document.getElementById("altura").value.trim();
        const lat = parseFloat(document.getElementById("lat").value);
        const lng = parseFloat(document.getElementById("lng").value);
        const aclaracion = document.getElementById("datos_adicionales").value.trim();
        const telefono = document.getElementById("telefono").value.trim();

        if (!lat || !lng) {
            crearModal("Error", "Debe seleccionar la ubicación en el mapa.", "error");
            return; // Detiene el envío
        };

        const direccionObj = {
            calle: calle,
            altura: altura,
            localidad: localidad,
            departamento: departamento,
            provincia: provincia,
            pais: "Argentina",
            lat: lat,
            lng: lng,
            aclaracion: aclaracion,
        };

        const payload = {
            cuit: cuit,
            nombre: nombre,
            email: email,
            rubro: rubro,
            rubro2: rubro2,
            telefonos: [parseInt(telefono)],
            direccion: direccionObj,
            logo: logoBase64
        };

        const respuesta = await fetch(`${BACKEND_URL}/empresas/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await respuesta.json();

        // ❌ ERROR DEL BACKEND
        if (!respuesta.ok) {
            crearModal(
                "Error al crear empresa",
                data.detail || "Ocurrió un error",
                "error"
            );
            return;
        }

        // ✅ ÉXITO REAL
        crearModal(
            "Empresa creada",
            data.msg,
            "success",
            () => {
                sessionStorage.setItem("empresa_activa_id", data.empresa_id);
                window.location.href = `../../usuario/mis-empresas/mis-empresas.html`;
            }
        );

    } catch (error) {
        console.error(error);
        crearModal(
            "Error inesperado",
            "No se pudo conectar con el servidor",
            "error"
        );
    }
}

/* ============================================================
   ======================= CAMBIO DE PASO ======================
   ============================================================ */

btnSiguiente.addEventListener("click", () => {

    const inputsRequeridos = seccionEmpresa.querySelectorAll("input[required]");

    for (let input of inputsRequeridos) {
        if (!input.value.trim()) {
            input.reportValidity();
            return;
        }
    }

    seccionEmpresa.classList.remove("activa");
    seccionDomicilio.classList.add("activa");

    setTimeout(() => {
        if (window.mapaLeaflet) {
            window.mapaLeaflet.invalidateSize();
        }
    }, 1000);

    scrollTo({ top: 0, behavior: "smooth" });
});

btnAnterior.addEventListener("click", () => {
    seccionDomicilio.classList.remove("activa");
    seccionEmpresa.classList.add("activa");
    scrollTo({ top: 0, behavior: "smooth" });
});

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

/* ============================================================
   ================== SUBIR LOGO Y PREVISUALIZAR ===============
   ============================================================ */

const inputLogo = document.getElementById("archivoLogo");
const btnSubir = document.querySelector(".btn-subir");
const imgPreview = document.querySelector(".logo-previo");

let logoBase64 = null;

if (inputLogo && btnSubir && imgPreview) {

    // Abrir selector de archivos
    btnSubir.addEventListener("click", () => {
        inputLogo.click();
    });

    // Al seleccionar archivo
    inputLogo.addEventListener("change", () => {
        const file = inputLogo.files[0];
        if (!file) return;

        /* ======================
           VALIDACIONES
        ====================== */

        // 1️⃣ Solo PNG
        if (file.type !== "image/png") {
            alert("Solo se permiten imágenes PNG.");
            inputLogo.value = "";
            return;
        }

        // 2️⃣ Máximo 40 KB
        const maxSize = 4 * 10 * 1024; // 40 KB
        if (file.size > maxSize) {
            alert("La imagen no puede superar los 40 KB.");
            inputLogo.value = "";
            return;
        }

        /* ======================
           BASE64 + PREVIEW
        ====================== */

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            // Preview
            imgPreview.src = dataUrl;

            // Guardar BASE64 PURO (sin data:image/png;base64,)
            logoBase64 = dataUrl.split(",")[1];
        };

        reader.readAsDataURL(file);
    });
}