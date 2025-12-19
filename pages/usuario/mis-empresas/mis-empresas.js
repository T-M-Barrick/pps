import { BACKEND_URL } from "../../../config.js";

const contenedor = document.getElementById("empresasContainer");

let misEmpresas = []

//   CARGAR EMPRESAS DINÁMICAMENTE
document.addEventListener("DOMContentLoaded", () => {
    cargarMisEmpresas();
});

async function cargarMisEmpresas() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/users/mis_empresas`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            contenedor.innerHTML = "<p>Error cargando empresas</p>";
            return;
        }

        const data = await respuesta.json();

        // Adaptar datos recibidos
        misEmpresas = Array.isArray(data)
            ? data.map(adaptarMisEmpresas)
            : [];

        if (misEmpresas.length === 0) {
            contenedor.innerHTML = "<p>No tenés empresas asociadas</p>";
            return;
        }

        contenedor.innerHTML = misEmpresas
            .map(emp => crearCardEmpresa(emp))
            .join("");

    } catch (error) {
        console.error("Error cargando empresas:", error);
        contenedor.innerHTML = "<p>Error al conectar con el servidor</p>";
    }
}

function adaptarMisEmpresas(apiEmpresa) {

    return {
        rol: apiEmpresa.rol,
        empresa_id: apiEmpresa.empresa_id,
        nombre_empresa: apiEmpresa.nombre_empresa,
        logo: apiEmpresa.logo_empresa 
                ? `data:image/png;base64,${apiEmpresa.logo_empresa}` 
                : "../../img/icono-perfil.png",
    };
}

// CARD DE EMPRESA 
function crearCardEmpresa(emp) {
    return `
        <div class="empresa-card" onclick="irAEmpresa(${emp.empresa_id})">

            <div class="empresa-card-header">
                <img src="${emp.logo}" class="empresa-logo">

                <div class="empresa-info">
                    <h3 class="empresa-nombre">${emp.nombre_empresa}</h3>
                    <p class="empresa-rol">${emp.rol}</p>
                </div>
            </div>

        </div>
    `;
}

// ACCESO A HOME-EMPRESA
window.irAEmpresa = function(id) {
    sessionStorage.setItem("empresa_activa_id", id);
    window.location.href = `../../empresa/home-empresa/home-empresa.html`;
};
