import {BACKEND_URL} from "../../../config.js";

let datosEmpresas = [];

const input = document.getElementById("busquedaEmpresas");
const contTurnos = document.getElementById("cardsContainer");
const contEmpresas = document.getElementById("empresasContainer");
const contFiltros = document.querySelector(".filters");

// BUSCADOR DE EMPRESAS
document.addEventListener("DOMContentLoaded", () => {

    // Ejecutar búsqueda solo con Enter
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && input.value.trim() !== "") {
            await ejecutarBusqueda();
        }
    });

    // Si el usuario borra todo, mostrar turnos otra vez
    input.addEventListener("input", async (e) => {
        const texto = e.target.value.trim();

        // SI EL BUSCADOR ESTÁ VACÍO
        if (texto === "") {
            sessionStorage.removeItem("empresas");
            datosEmpresas = [];
            contEmpresas.style.display = "none";
            contTurnos.style.display = "grid";
            contFiltros.style.display = "flex";
            mostrarEmpresas();
            return;
        }
    });
});

function adaptarEmpresa(emp) {

    return {
        id: emp.id,
        cuit: emp.cuit,
        nombre: emp.nombre,
        email: emp.email,
        rubro: emp.rubro,
        rubro2: emp.rubro2,
        logo: emp.logo
                ? `data:image/png;base64,${emp.logo}` 
                : "../../img/icono-perfil.png",
        calle: emp.direccion.calle,
        altura: emp.direccion.altura || "",
        localidad: emp.direccion.localidad,
        departamento: emp.direccion.departamento,
        provincia: emp.direccion.provincia,
        pais: emp.direccion.pais,
        lat: emp.direccion.lat,
        lng: emp.direccion.lng,
        aclaracion_de_direccion: emp.direccion.aclaracion || "",
        calificacion: emp.calificacion
    };
}

//   CREAR TARJETA DE EMPRESA
function crearCardEmpresa(emp) {

    let fullStars = Math.floor(emp.calificacion);
    let halfStar = emp.calificacion % 1 >= 0.5;
    let emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let estrellasHTML = '';

    for (let i = 0; i < fullStars; i++)
        estrellasHTML += `<i class="fa-solid fa-star star-full"></i>`;

    if (halfStar)
        estrellasHTML += `<i class="fa-solid fa-star-half-stroke star-full"></i>`;

    for (let i = 0; i < emptyStars; i++)
        estrellasHTML += `<i class="fa-regular fa-star star-empty"></i>`;

    return `
        <div class="empresa-card" onclick="window.location.href='../panel-empresa/panel-empresa.html?id=${emp.id}'">
            <img src="${emp.logo}" class="empresa-logo" alt="Logo empresa">

            <div class="empresa-info">
                <h3>${emp.nombre}</h3>
                <p class="empresa-rubro">${emp.rubro}</p>

                <div class="empresa-rating">
                    ${estrellasHTML}
                    <span class="rating-num">${emp.calificacion.toFixed(1)}</span>
                </div>
            </div>
        </div>
    `;
}

// Función que hace la búsqueda de empresas
async function ejecutarBusqueda() {
    const texto = input.value.trim();
    if (!texto) return; // nada que buscar

    // Ocultar turnos
    contTurnos.style.display = "none";
    contFiltros.style.display = "none";
    contEmpresas.style.display = "grid";
    contEmpresas.style.position = "relative";

    await buscarEmpresas(texto);
    mostrarEmpresas(datosEmpresas)
}

async function buscarEmpresas(texto) {
    const lat = JSON.parse(sessionStorage.getItem("usuario")).direcciones[0].lat;
    const lng = JSON.parse(sessionStorage.getItem("usuario")).direcciones[0].lng;

    const resp = await fetch(`${BACKEND_URL}/users/empresas/search?query=${texto}&lat=${lat}&lng=${lng}`, {
        credentials: "include",
    });

    if (!resp.ok) {
        console.error("No se pudo obtener los datos de las empresas.");
        datosEmpresas = []
        return;
    }

    const empresas = await resp.json();

    sessionStorage.setItem("empresas", JSON.stringify(empresas));
    datosEmpresas = empresas.map(adaptarEmpresa);
}

function mostrarEmpresas(empresas) {
    contEmpresas.innerHTML = ""; // limpia solo empresas

    if (!empresas || empresas.length === 0) {
        empresasContainer.innerHTML = `
            <div class="mensaje-empresas-vacio">
                <p>No se encontraron empresas que coincidan con tu búsqueda</p>
            </div>
        `;
        return;
    }

    empresas.forEach(emp => {
        const tarjeta = crearCardEmpresa(emp);
        empresasContainer.appendChild(tarjeta);
    });
}