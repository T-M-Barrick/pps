import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

const empresaId = sessionStorage.getItem("empresa_activa_id");

if (!empresaId) {
    // No hay empresa seleccionada → redirigir
    window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
}

// =====================================
// ELEMENTOS DEL DOM
// =====================================
const logoImg = document.getElementById("empresaLogo");
const nombreEl = document.getElementById("empresaNombre");
const rubroEl = document.getElementById("empresaRubro");
const rolEl = document.getElementById("empresaRol");

// =====================================
// CARGA INICIAL
// =====================================
document.addEventListener("DOMContentLoaded", () => {
        cargarDatosDesdeBackend();
});

async function cargarDatosDesdeBackend() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.error("No se pudieron obtener los datos de la empresa.");
            window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
            return;
        }

        const empresa = await respuesta.json();
        renderizarPanel(empresa);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
    }
}

// =====================================
// RENDERIZA INFORMACIÓN EN PANTALLA
// =====================================
function renderizarPanel(empresa) {

    // LOGO
    logoImg.src = empresa.logo 
        ? `data:image/png;base64,${empresa.logo}` 
        : "../../img/icono-perfil.png";


    // NOMBRE
    nombreEl.textContent = empresa.nombre || "Nombre no disponible";

    // RUBRO
    rubroEl.textContent = empresa.rubro || "Sin rubro";

    // ROL DEL USUARIO
    rolEl.textContent = `Rol: ${empresa.rol.charAt(0).toUpperCase() + empresa.rol.slice(1)}`;

    // Controles por rol
    manejarPermisos(empresa.rol);
}

// =====================================
// PERMISOS POR ROL
// =====================================
function manejarPermisos(rol) {

    if (rol === "empleado") {
        deshabilitarBoton("Editar Perfil");
        deshabilitarBoton("Miembros");
        deshabilitarBoton("Servicios");
    }
}

// =====================================
// DESHABILITAR BOTONES
// =====================================
function deshabilitarBoton(texto) {
    const botones = document.querySelectorAll(".boton-menu");

    botones.forEach(btn => {
        if (btn.textContent.includes(texto)) {
            btn.style.opacity = "0.4";
            btn.style.cursor = "not-allowed";
            btn.onclick = () => alert("No tienes permisos para acceder aquí.");
        }
    });
}
