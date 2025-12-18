import { BACKEND_URL, manejarErrorRespuesta, formatearFecha } from "../../../config.js";

let ultimoCursor = null;
let cargando = false;

document.addEventListener("DOMContentLoaded", () => {
    cargarHistorial();
    
    document.getElementById("btnCargarMas")
        ?.addEventListener("click", cargarHistorial);
});

async function cargarHistorial() {
    if (cargando) return;
    cargando = true;

    let url = `${BACKEND_URL}/users/historial`;
    if (ultimoCursor) {
        url += `?before=${encodeURIComponent(ultimoCursor)}`;
    }

    try {
        const data = await manejarErrorRespuesta(
            await fetch(url, {
                method: "GET",
                credentials: "include"
            }),
            "No se pudo cargar el historial"
        );

        renderizarHistorial(data.historial);

        // guardamos el cursor para la próxima página
        ultimoCursor = data.ultimo_cursor;

        // si ya no hay más
        if (!ultimoCursor) {
            document.getElementById("btnCargarMas")?.remove();
        }

    } catch (err) {
        console.error(err);
    } finally {
        cargando = false;
    }
}

function renderizarHistorial(historial) {
    const contenedor = document.getElementById("historialContainer");

    if (!historial || historial.length === 0) {
        if (!ultimoCursor) {
            contenedor.innerHTML = `<p>No hay turnos en el historial.</p>`;
        }
        return;
    }

    historial.forEach(turno => {
        const profesional = turno.profesional_apellido
            ? `${turno.profesional_apellido}, ${turno.profesional_nombre}`
            : "—";

        contenedor.insertAdjacentHTML("beforeend", `
            <div class="turno-card">
                <div class="turno-header">
                    <h3 class="turno-empresa">${turno.empresa}</h3>
                    <span class="turno-estado ${getEstadoClase(turno.estado_turno)}">
                        ${turno.estado_turno}
                    </span>
                </div>

                <p><i class="fa-solid fa-scissors"></i> Servicio: ${turno.nombre_de_servicio}</p>
                <p><i class="fa-solid fa-user"></i> Profesional: ${profesional}</p>
                <p><i class="fa-solid fa-clock"></i> Fecha: ${formatearFecha(turno.fecha_hora)}</p>
                <p><strong> Precio: $${turno.precio ?? "—"}</strong></p>
            </div>
        `);
    });
}

// COLOR POR ESTADO 
function getEstadoClase(estado) {
    const e = estado.toLowerCase().trim();

    if (e === "cumplido") return "cumplido";
    if (e === "no-cumplido" || e === "no cumplido") return "no-cumplido";
    if (e === "cancelado-usuario" || e === "cancelado por usuario") return "cancelado-usuario";
    if (e === "cancelado-empresa" || e === "cancelado por empresa") return "cancelado-empresa";

    return "";
}