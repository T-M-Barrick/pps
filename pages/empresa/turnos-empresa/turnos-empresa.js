import { BACKEND_URL, manejarErrorRespuesta, formatearFecha, formatearHora } from "../../../config.js";

const empresaId = sessionStorage.getItem("empresa_activa_id");

if (!empresaId) {
    // No hay empresa seleccionada → redirigir
    window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
}

// ========================================
//         CONFIGURACIÓN DE ESTADOS
// ========================================
const configuracionEstado = {
    confirmado: {
        label: "Confirmado",
        class: "confirmado"
    },
    cumplido: {
        label: "Cumplido",
        class: "cumplido"
    },
    no_cumplido: {
        label: "No cumplido",
        class: "no_cumplido"
    },
    cancelado_usuario: {
        label: "Cancelado por usuario",
        class: "cancelado"
    },
    cancelado_empresa: {
        label: "Cancelado por empresa",
        class: "cancelado"
    },
    vencido: {
        label: "Vencido",
        class: "vencido"
    }
};

let turnoSeleccionado = null;
let datosTurnos = [];

let listaTurnos;
let filtroFecha;
let filtroEstado;
let filtroProfesional;

let modalTurno;
let btnEliminarTurno;

let mCliente, mDni, mFecha, mHora, mServicio,
    mDuracion, mPrecio, mAclaracion,
    mProfesional, mProfesionalDni;

document.addEventListener("DOMContentLoaded", async () => {

    listaTurnos = document.getElementById("listaTurnos");

    filtroFecha = document.getElementById("filtroFecha");
    filtroEstado = document.getElementById("filtroEstado");
    filtroProfesional = document.getElementById("filtroProfesional");

    modalTurno = document.getElementById("modalTurno");

    mCliente = document.getElementById("mCliente");
    mDni = document.getElementById("mDni");
    mFecha = document.getElementById("mFecha");
    mHora = document.getElementById("mHora");
    mServicio = document.getElementById("mServicio");
    mDuracion = document.getElementById("mDuracion");
    mPrecio = document.getElementById("mPrecio");
    mAclaracion = document.getElementById("mAclaracion");
    mProfesional = document.getElementById("mProfesional");
    mProfesionalDni = document.getElementById("mProfesionalDni");


    document.getElementById("btnCerrarModal").onclick = () => modalTurno.classList.remove("show");
    const btnCumplido = document.getElementById("btnCumplido");
    const btnNoCumplido = document.getElementById("btnNoCumplido");
    const btnCancelarTurno = document.getElementById("btnCancelarTurno");
    btnEliminarTurno = document.getElementById("btnEliminarTurno");

    // ========== MODIFICAR ESTADO ==========
    btnCumplido.onclick = async () => {
        if (!turnoSeleccionado) return;

        const turnoActualizado = await actualizarEstadoTurno(
            turnoSeleccionado.id,
            "cumplido"
        );

        if (!turnoActualizado) return;

        modalTurno.classList.remove("show");
        aplicarFiltros(filtroFecha, filtroEstado, filtroProfesional);

        // volver a abrir modal actualizado
        setTimeout(() => {
            mostrarDetalleTurno(turnoActualizado);
        }, 0);
    };

    btnNoCumplido.onclick = async () => {
        if (!turnoSeleccionado) return;

        const turnoActualizado = await actualizarEstadoTurno(
            turnoSeleccionado.id,
            "no cumplido"
        );

        if (!turnoActualizado) return;

        modalTurno.classList.remove("show");
        aplicarFiltros(filtroFecha, filtroEstado, filtroProfesional);

        // volver a abrir modal actualizado
        setTimeout(() => {
            mostrarDetalleTurno(turnoActualizado);
        }, 0);
    };

    btnCancelarTurno.onclick = async () => {
        if (!turnoSeleccionado) return;
        f = turnoSeleccionado.fechaOriginal
        dur = turnoSeleccionado.duracion

        if (calcularTiempoRestante(f, dur) === "En hora" || calcularTiempoRestante(f, dur) === "Vencido") return;

        const turnoActualizado = await actualizarEstadoTurno(
            turnoSeleccionado.id,
            "cancelado por empresa"
        );

        if (!turnoActualizado) return;

        modalTurno.classList.remove("show");
        aplicarFiltros(filtroFecha, filtroEstado, filtroProfesional);

        // volver a abrir modal actualizado
        setTimeout(() => {
            mostrarDetalleTurno(turnoActualizado);
        }, 0);
    };

    if (btnEliminarTurno) {
        btnEliminarTurno.onclick = async () => {
            if (!turnoSeleccionado) return;

            if (turnoSeleccionado.estado === "confirmado") {
                return;
            }

            const idEliminado = await eliminarTurno(turnoSeleccionado.id);
            if (!idEliminado) return;

            modalTurno.classList.remove("show");
            aplicarFiltros(filtroFecha, filtroEstado, filtroProfesional);
        };
    };

    const data = await cargarDatosDesdeBackend();

    if (data) {
        datosTurnos = data.map(adaptarTurno)
    };

    [filtroFecha, filtroEstado, filtroProfesional].forEach(el => {
        el.onchange = () => aplicarFiltros(filtroFecha, filtroEstado, filtroProfesional);
    });

    renderTurnos(datosTurnos);
    cargarFiltroProfesional(datosTurnos); 
});

async function cargarDatosDesdeBackend() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.error("No se pudieron obtener los turnos de la empresa.");
            window.location.href = "../home-empresa/home-empresa.html";
            return;
        }

        const empresa = await respuesta.json();
        return empresa.turnos

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../home-empresa/home-empresa.html";
    }
};

function renderTurnos(lista) {
    listaTurnos.innerHTML = "";

    lista.forEach(t => {
        const estadoConf = configuracionEstado[t.estado];

        const div = document.createElement("div");
        div.className = `turno-card ${estadoConf.class}`;

        div.innerHTML = `
            <div class="turno-header">
                <span>${t.usuario_nombre_completo}</span>
                <span class="badge ${estadoConf.class}">
                    ${estadoConf.label}
                </span>
            </div>

            <div class="turno-dato"><b>DNI:</b> ${t.usuario_dni}</div>
            <div class="turno-dato">
                <b>Fecha:</b> ${t.fecha}
                <b>Hora:</b> ${t.hora}
            </div>
            <div class="turno-dato"><b>Servicio:</b> ${t.nombre_de_servicio}</div>

            <button class="btn-detalle">Ver detalle</button>
        `;

        div.querySelector(".btn-detalle").onclick = () => mostrarDetalleTurno(t);
        listaTurnos.appendChild(div);
    });
}

// ========== FILTROS ==========
function aplicarFiltros(filtFecha, filtEstado, filtProf) {
    let lista = [...datosTurnos];

    if (filtFecha.value) {
        lista = lista.filter(t =>
            t.fechaOriginal.startsWith(filtFecha.value)
        );
    }

    if (filtEstado.value) {
        lista = lista.filter(t =>
            t.estado === filtEstado.value
        );
    }

    if (filtProf.value) {
        lista = lista.filter(t => {
            const nombre = t.profesional_apellido && t.profesional_nombre
                ? `${t.profesional_apellido}, ${t.profesional_nombre}`
                : "Sin asignar";

            return nombre === filtProf.value;
        });
    }

    renderTurnos(lista);
}

// ========== CARGAR PROFESIONALES ==========
function cargarFiltroProfesional(lista) {
    const unicos = new Set();

    lista.forEach(t => {
        if (t.profesional_nombre && t.profesional_apellido) {
            unicos.add(`${t.profesional_apellido}, ${t.profesional_nombre}`);
        } else {
            unicos.add("Sin asignar");
        }
    });

    filtroProfesional.innerHTML = `
        <option value="">Todos los profesionales</option>
    `;

    unicos.forEach(nombre => {
        filtroProfesional.innerHTML += `
            <option value="${nombre}">${nombre}</option>
        `;
    });
}

// ========== MODAL DETALLE ==========
function mostrarDetalleTurno(turno) {
    turnoSeleccionado = turno;

    mCliente.textContent = turno.usuario_nombre_completo;
    mDni.textContent = turno.usuario_dni;

    mFecha.textContent = turno.fecha;
    mHora.textContent = turno.hora;

    mServicio.textContent = turno.nombre_de_servicio;
    mDuracion.textContent = turno.duracion + " min";
    mPrecio.textContent = "$" + turno.precio;
    mAclaracion.textContent = turno.aclaracion_de_servicio || "—";

    mProfesional.textContent =
        turno.profesional_nombre
            ? `${turno.profesional_apellido}, ${turno.profesional_nombre}`
            : "—";

    mProfesionalDni.textContent = turno.profesional_dni ?? "—";

    const estadoBadge = document.getElementById("mEstadoBadge");

    const estadoConf = configuracionEstado[turno.estado];

    estadoBadge.textContent = estadoConf.label;
    estadoBadge.className = `badge-modal ${estadoConf.class}`;

    // 🔒 mostrar eliminar SOLO si NO es confirmado
    if (turno.estado === "confirmado") {
        btnEliminarTurno.style.display = "none";
    } else {
        btnEliminarTurno.style.display = "inline-block";
    }

    modalTurno.classList.add("show");
}

function turnoEstaVencido(fechaHoraISO, duracionMinutos) {
    if (!fechaHoraISO) return false;

    // Convertimos la fecha "tal cual llega" a Date
    const inicioLocal = new Date(fechaHoraISO);

    // Convertimos a milisegundos UTC sumando la diferencia de zona
    const inicioUTC = inicioLocal.getTime() + (inicioLocal.getTimezoneOffset() * 60000);

    const finUTC = inicioUTC + (duracionMinutos ?? 0) * 60000;

    // Ahora en UTC
    const ahoraUTC = Date.now();

    return ahoraUTC > finUTC;
};

// ==============================
//  ADAPTAR TURNO PARA EL FRONT
// ==============================
function adaptarTurno(apiTurno) {

    let estadoLimpio = apiTurno.estado_turno;

    if (estadoLimpio === "no cumplido") {
        estadoLimpio = "no_cumplido";
    }

    if (estadoLimpio === "cancelado por usuario") {
        estadoLimpio = "cancelado_usuario";
    }

    if (estadoLimpio === "cancelado por empresa") {
        estadoLimpio = "cancelado_empresa";
    }

    // Si está confirmado pero ya se venció → se fuerza a "vencido"
    if (estadoLimpio === "confirmado" && turnoEstaVencido(apiTurno.fecha_hora, apiTurno.duracion)) {
        estadoLimpio = "vencido";
    }

    return {
        id: apiTurno.id,
        usuario_dni: apiTurno.usuario_dni,
        usuario_nombre_completo: `${apiTurno.usuario_apellido}, ${apiTurno.usuario_nombre}`,
        estado: estadoLimpio,
        servicio_id: apiTurno.servicio_id,
        nombre_de_servicio: apiTurno.nombre_de_servicio,
        duracion: apiTurno.duracion ?? 0,
        precio: apiTurno.precio,
        aclaracion_de_servicio: apiTurno.aclaracion_de_servicio,
        profesional_dni: apiTurno.profesional_dni,
        profesional_apellido: apiTurno.profesional_apellido,
        profesional_nombre: apiTurno.profesional_nombre,
        fecha: formatearFecha(apiTurno.fecha_hora),
        hora: formatearHora(apiTurno.fecha_hora),
        fechaOriginal: apiTurno.fecha_hora
    };
}

function actualizarDatosTurno(turnoApi) {
    const turnoAdaptado = adaptarTurno(turnoApi);

    const idx = datosTurnos.findIndex(t => t.id === turnoAdaptado.id);
    if (idx !== -1) {
        datosTurnos[idx] = turnoAdaptado;
    }

    return turnoAdaptado;
}

async function actualizarEstadoTurno(id, nuevoEstado) {
    try {
        const turnoActualizado = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/empresas/${empresaId}/turnos`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: id,
                    estado_turno: nuevoEstado,
                    recordatorio: null
                })
            }),
            "Error al actualizar turno"
        );

        // Adaptar y actualizar datosTurnos
        return actualizarDatosTurno(turnoActualizado);

    } catch (err) {
        console.error(err);
        alert("Hubo un error actualizando el turno.");
        return null;
    }
}

async function actualizarEstadosTurnos(filtFecha, filtEstado, filtProf) {
    try {
        const resp = await fetch(`${BACKEND_URL}/empresas/${empresaId}/turnos/estados`, {
            credentials: "include"
        });

        if (!resp.ok) {
            console.warn("No se pudieron actualizar los estados");
            return;
        }

        const estados = await resp.json();

        // Reemplazar estados dentro de datosTurnos
        estados.forEach(est => {
            const idx = datosTurnos.findIndex(t => t.id === est.id);
            if (idx !== -1) {
                datosTurnos[idx].estado = est.estado;
            }
        });

        aplicarFiltros(filtFecha, filtEstado, filtProf);

    } catch (err) {
        console.error("Error al actualizar estados:", err);
    }
}

// ========================================
//     ELIMINAR TURNO → envia a historial
// ========================================
async function eliminarTurno(id) {
    try {
        const data = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/empresas/${empresaId}/turnos/${id}`, {
                method: "DELETE",
                credentials: "include"
            }),
            "Error al eliminar turno"
        );

        const idEliminado = data.turno_id;

        datosTurnos = datosTurnos.filter(t => t.id !== idEliminado);

        // Adaptar y actualizar datosTurnos
        return idEliminado

    } catch (err) {
        console.error(err);
        alert("Hubo un error eliminando el turno.");
        return null;
    }
};

function calcularTiempoRestante(fechaHoraISO, duracionMinutos) {
    if (!fechaHoraISO) return "—";

    const inicioLocal = new Date(fechaHoraISO);
    const inicioUTC = inicioLocal.getTime() + (inicioLocal.getTimezoneOffset() * 60000);
    const finUTC = inicioUTC + (duracionMinutos ?? 0) * 60000;

    const ahoraUTC = Date.now();

    // Si ya terminó el turno
    if (ahoraUTC > finUTC) return "Vencido";

    // Si ya empezó pero aún no terminó
    if (ahoraUTC >= inicioUTC) return "En hora";

    // Faltan X segundos para que empiece
    let diffSeg = Math.floor((inicioUTC - ahoraUTC) / 1000);

    // Si falta menos de 1 minuto
    if (diffSeg < 60) return "Falta 1 minuto";

    const minutos = Math.floor(diffSeg / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const semanas = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30); // redondeo mensual estándar

    // Convertir años a meses
    if (meses >= 12) {
        return `Faltan ${meses} meses`;
    }

    if (meses >= 1) {
        return meses === 1 
            ? "Falta 1 mes"
            : `Faltan ${meses} meses`;
    }

    if (semanas >= 1) {
        return semanas === 1 
            ? "Falta 1 semana"
            : `Faltan ${semanas} semanas`;
    }

    if (dias >= 1) {
        return dias === 1 
            ? "Falta 1 día"
            : `Faltan ${dias} días`;
    }

    if (horas >= 1) {
        return horas === 1
            ? "Falta 1 hora"
            : `Faltan ${horas} horas`;
    }

    if (minutos >= 1) {
        return minutos === 1
            ? "Falta 1 minuto"
            : `Faltan ${minutos} minutos`;
    }

    return "Falta 1 minuto"; // fallback seguro
}

// Actualiza estados cada 5 minutos
setInterval(
    () => actualizarEstadosTurnos(filtroFecha, filtroEstado, filtroProfesional),
    5 * 60 * 1000
);