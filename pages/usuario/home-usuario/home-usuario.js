/* Renderiza (muestra) tarjetas de turnos, Muestra un modal con el detalle del turno, Permite
cambiar estados PERO SOLO LOCALMENTE (sin backend), etc.*/

import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

// ========================================
//         CONFIGURACIÓN DE ESTADOS
// ========================================
const configuracionEstado = {
    confirmado: { label: 'Confirmado', class: 'status-confirmado' },
    cumplido: { label: 'Cumplido', class: 'status-cumplido' },
    'no-cumplido': { label: 'No cumplido', class: 'status-no-cumplido' },
    'cancelado-usuario': { label: 'Cancelado por usuario', class: 'status-cancelado-usuario' },
    'cancelado-empresa': { label: 'Cancelado por empresa', class: 'status-cancelado-empresa' },
    vencido: { label: 'Vencido', class: 'status-vencido' }   // ← AGREGADO
};

// ========================================
//       ESTADO GLOBAL
// ========================================
let estadoApp = {
    filtroActivo: 'todos',
    busqueda: ''
};

let datosTurnos = [];
let turnoRecordatorioSeleccionado = null;
let turnoIdCalificando = null;
let calificacionSeleccionada = null;

document.addEventListener("DOMContentLoaded", async () => {

    await cargarDatosDesdeBackend();

    // 1️⃣ Cargar turnos desde sessionStorage
    const turnosGuardados = sessionStorage.getItem("usuarioturnos");

    if (turnosGuardados) {
        const turnosAPI = JSON.parse(turnosGuardados);
        datosTurnos = turnosAPI.map(adaptarTurno);
    }

    // 2️⃣ Configurar botones de filtro
    const filtros = document.querySelectorAll('.filter-btn');

    filtros.forEach(btn => {
        btn.addEventListener('click', () => {
            filtros.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            estadoApp.filtroActivo = btn.dataset.filter;
            renderizarTarjetas(); // llamada al hacer click en un botón
        });
    });

    // 3️⃣ Renderizar todas las tarjetas al cargar la página
    renderizarTarjetas(); // llamada al cargar la página
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
            window.location.href = "../../../index.html";
            return;
        }

        const usuario = await respuesta.json();

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
        sessionStorage.setItem("usuarioturnos", JSON.stringify(usuario.turnos));

        // Mostrar bienvenida
        mostrarBienvenida(usuario);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../../../index.html";
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

function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);

    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();

    return `${dia}/${mes}/${año}`;
}

function turnoEstaVencido(fechaHoraISO, duracionMinutos) {
    if (!fechaHoraISO) return false;

    const inicio = new Date(fechaHoraISO);
    const fin = new Date(inicio.getTime() + (duracionMinutos ?? 0) * 60000);
    const ahora = new Date();

    return ahora > fin; 
}

function calcularTiempoRestante(fechaHoraISO, duracionMinutos) {
    const inicio = new Date(fechaHoraISO);
    const fin = new Date(inicio.getTime() + (duracionMinutos ?? 0) * 60000);
    const ahora = new Date();

    // Si ya terminó el turno
    if (ahora > fin) return "Vencido";

    // Si ya empezó pero aún no terminó
    if (ahora >= inicio) return "En hora";

    // Faltan X segundos para que empiece
    let diffSeg = Math.floor((inicio - ahora) / 1000);

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

function limpiarDomicilio(domicilio) {
    if (!domicilio) return "";
    const partes = domicilio.split(",").map(p => p.trim());
    // Sacar provincia (última parte)
    partes.pop();
    return partes.join(", ");
}

function desglosarRecordatorio(minutosTotales) {
    if (minutosTotales === null || minutosTotales === undefined) {
        return null;   // nada
    }

    if (minutosTotales <= 0) {
        return { horas: 0, minutos: 0 };
    }

    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;

    return { horas, minutos };
}

// ==============================
//  ADAPTAR TURNO PARA EL FRONT
// ==============================
function adaptarTurno(apiTurno) {

    const recordatorioInfo = desglosarRecordatorio(apiTurno.recordatorio);

    let estadoLimpio = apiTurno.estado_turno;

    if (estadoLimpio === "no cumplido") {
        estadoLimpio = "no-cumplido";
    }

    if (estadoLimpio === "cancelado por usuario") {
        estadoLimpio = "cancelado-usuario";
    }

    if (estadoLimpio === "cancelado por empresa") {
        estadoLimpio = "cancelado-empresa";
    }

    // Si está confirmado pero ya se venció → se fuerza a "vencido"
    if (estadoLimpio === "confirmado" && turnoEstaVencido(apiTurno.fecha_hora, apiTurno.duracion)) {
        estadoLimpio = "vencido";
    }

    return {
        id: apiTurno.id,
        empresa_id: apiTurno.empresa_id,
        empresa: apiTurno.empresa,
        logo: apiTurno.logo_empresa 
                ? `data:image/png;base64,${apiTurno.logo_empresa}` 
                : "../../img/icono-perfil.png",
        domicilio: limpiarDomicilio(apiTurno.direccion.domicilio),
        lat: apiTurno.direccion.lat,
        lng: apiTurno.direccion.lng,
        aclaracion_de_direccion: apiTurno.direccion.aclaracion,
        estado: estadoLimpio,
        nombre_de_servicio: apiTurno.nombre_de_servicio,
        duracion: apiTurno.duracion ?? 0,
        precio: apiTurno.precio,
        aclaracion_de_servicio: apiTurno.aclaracion_de_servicio,
        profesional_dni: apiTurno.profesional_dni,
        profesional_apellido: apiTurno.profesional_apellido,
        profesional_nombre: apiTurno.profesional_nombre,
        fecha: formatearFecha(apiTurno.fecha_hora),
        hora: apiTurno.fecha_hora.split("T")[1].slice(0,5),
        fechaOriginal: apiTurno.fecha_hora,
        tiempoRestante: calcularTiempoRestante(apiTurno.fecha_hora, apiTurno.duracion),
        recordatorio_horas: recordatorioInfo?.horas ?? null,
        recordatorio_minutos: recordatorioInfo?.minutos ?? null
    };
}

// ========================================
//     CARGA DE TURNOS DESDE SESSION
// ========================================

// Renderiza TODAS las tarjetas
function renderizarTarjetas() {
    const contenedor = document.getElementById('cardsContainer');
    if (!contenedor) return;

    contenedor.innerHTML = "";
    let turnos = datosTurnos;

    if (estadoApp.filtroActivo === "hoy") {
        const hoy = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        turnos = turnos.filter(t => t.fechaOriginal.split("T")[0] === hoy);
    }

    if (turnos.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center; padding:30px; color:#777;">No se encontraron turnos</div>`;
        return;
    }

    turnos.forEach(t => renderizarTarjeta(t));
}

// Renderiza UNA tarjeta individual cuando el turno no existe aún
function renderizarTarjeta(turno) {
    const contenedor = document.getElementById('cardsContainer');
    if (!contenedor) return;

    const tarjeta = crearTarjeta(turno);
    contenedor.appendChild(tarjeta);
}

// Actualiza una tarjeta específica (reemplaza la tarjeta vieja por una nueva)
function actualizarTarjeta(turnoActualizado) {
    const tarjetaExistente = document.getElementById(`tarjeta-${turnoActualizado.id}`);
    if (!tarjetaExistente) return;

    const nuevaTarjeta = crearTarjeta(turnoActualizado);
    tarjetaExistente.replaceWith(nuevaTarjeta);
}

// ========================================
//     CREAR TARJETA INDIVIDUAL
// ========================================
function crearTarjeta(turno) {
    const estado = configuracionEstado[turno.estado];

    const card = document.createElement("div");
    card.className = `card ${turno.estado}`;
    card.id = `tarjeta-${turno.id}`;
    card.onclick = () => mostrarDetalleTurno(turno.id);

    card.innerHTML = `
        <div class="card-header-status">
            <span class="card-status ${estado.class}">${estado.label}</span>
        </div>

        <div class="card-header-main">
            <img src="${turno.logo || '../../img/icono-perfil.png'}" class="card-logo">
            <div class="card-header-info">
                <strong>${turno.empresa}</strong>
            </div>
        </div>

        <div class="card-time">${turno.hora}</div>

        <div class="card-date-block">
            <div class="card-date">${turno.fecha}</div>
            <div class="card-time-left">${turno.tiempoRestante}</div>
        </div>

        <div class="card-details">
            <div class="card-detail-label">Servicio</div>
            <div class="card-detail-value">${turno.nombre_de_servicio}</div>
        </div>

       <div class="card-footer">
          <a href="#" class="card-link">
           <i class="fas fa-map-marker-alt"></i> Ver Dirección
          </a>
       </div>
    `;

    // Seleccionamos el link y le agregamos el evento
    const link = card.querySelector(".card-link");
    link.addEventListener("click", (e) => {
        e.stopPropagation(); // no disparar el click del card
        mostrarUbicacion(turno.lat, turno.lng);
    });

    return card;
}

// ========================================
//       MODAL → DETALLE DE TURNO
// ========================================
function mostrarDetalleTurno(id) {
    const turno = datosTurnos.find(t => t.id === id);
    const modal = document.getElementById("turnoDetailModal");
    const body = document.getElementById("modalBody");

    if (!turno) return;

    const estado = configuracionEstado[turno.estado];
    const precioMostrado = turno.precio || '—';

    // BOTONES SEGÚN ESTADO
    let botones = `
    <button class="btn-small btn-cumplido">Cumplido</button>
    <button class="btn-small btn-no-cumplido">No cumplido</button>
    <button class="btn-small btn-whatsapp">WhatsApp</button>
`;

    // Si está confirmado → mostrar Cancelar Turno
    if (turno.estado === "confirmado") {
        botones += `
    <button class="btn-cancelar-turno">Cancelar turno</button>
`;
    }

    // Si está cumplido / no cumplido / cancelado por usuario / cancelado por empresa / vencido → mostrar Eliminar turno
    if (['cumplido', 'no-cumplido', 'cancelado-usuario', 'cancelado-empresa', 'vencido'].includes(turno.estado)) {
        botones += `<button class="btn-small btn-eliminar">Eliminar turno</button>`;
    }

    body.innerHTML = `
    <div class="modal-right">
        <span class="modal-status ${estado.class}">${estado.label}</span>
    </div>
        <div class="modal-header-top">

            <div class="modal-logo-nombre">
          
                <img src="../../img/icono-perfil.png" class="modal-logo">
                <span class="modal-empresa">${turno.empresa}</span>  
            </div>
        </div>

        <div class="modal-row spacing">
            <i class="fas fa-clock"></i>
            <span>${turno.hora}</span>
            <span>${turno.fecha}</span>
        </div>

        <div class="modal-row">
            <i class="fas fa-hourglass-half"></i>
            <span>${turno.tiempoRestante}</span>
        </div>

        <div class="modal-row">
            <i class="fas fa-map-marker-alt"></i>
            <span>
                ${turno.domicilio}
                <a href="#" onclick="mostrarUbicacion('${turno.lat}', '${turno.lng}')" class="modal-ver-direccion">Ver Dirección</a>
            </span>
            <span>${turno.aclaracion_de_direccion}</span>
        </div>

        <div class="modal-row">
            <i class="fas fa-scissors"></i>
            <span>Servicio: ${turno.nombre_de_servicio}</span>
        </div>

        <div class="modal-row">
            <i class="fas fa-user-tie"></i>
            <span>Profesional: ${turno.profesional_apellido}, ${turno.profesional_nombre}</span>
        </div>

        <div class="modal-row">
            <i class="fas fa-hourglass"></i>
            <span>Duración: ${turno.duracion} minutos</span>
        </div>

<div class="modal-row modal-precio-recordatorio">

    <div class="precio-left">
        <i class="fas fa-dollar-sign"></i>
        <span>Precio: $ ${precioMostrado}</span>
    </div>

    <div class="recordatorio-right" onclick="abrirRecordatorio(${turno.id})">
        <i class="fas fa-bell"></i>
        <span class="recordatorio-label">Configurar Recordatorio</span>
    </div>

</div>

        <p class="modal-detalle">${turno.aclaracion_de_servicio}</p>

        <div class="modal-buttons">
            ${botones}
        </div>
    `;

    // eventos
    body.querySelector(".btn-cumplido").onclick = async () => {
        abrirModalCalificacion(id);
    };

    body.querySelector(".btn-no-cumplido").onclick = async () => {
        const turnoActualizado = await actualizarEstadoTurno(turno.id, "no cumplido");
        if (!turnoActualizado) return;

        actualizarTarjeta(turnoActualizado);

        cerrarDetalleTurno();

        mostrarDetalleTurno(turnoActualizado.id);
    };

    const btnCancelar = body.querySelector(".btn-cancelar-turno");
    if (btnCancelar) btnCancelar.onclick = async () => {
        if (turno.tiempoRestante === "En hora" || turno.tiempoRestante === "Vencido") return;

        const turnoActualizado = await actualizarEstadoTurno(turno.id, "cancelado por usuario");
        if (!turnoActualizado) return;

        actualizarTarjeta(turnoActualizado);

        cerrarDetalleTurno();

        mostrarDetalleTurno(turnoActualizado.id);
    };

    const btnEliminar = body.querySelector(".btn-eliminar");
    if (btnEliminar) btnEliminar.onclick = async () => {
        const idEliminado = await eliminarTurno(turno.id);
        if (!idEliminado) return;

        cerrarDetalleTurno();

        // Eliminar la tarjeta del DOM
        const tarjeta = document.getElementById("tarjeta-" + idEliminado);
        if (tarjeta) tarjeta.remove();

    };

    body.querySelector(".btn-whatsapp").onclick = () =>
        contactarWhatsapp(turno.id);

    modal.style.display = "flex";
}

function cerrarDetalleTurno() {
    document.getElementById("turnoDetailModal").style.display = "none";
}

function reemplazarTurnoEnSession(turnoApi) {
    let turnos = JSON.parse(sessionStorage.getItem("usuarioturnos")) || [];

    const idx = turnos.findIndex(t => t.id === turnoApi.id);
    if (idx !== -1) {
        turnos[idx] = turnoApi; // ← SE GUARDA TAL CUAL VIENE DEL BACKEND
    }

    sessionStorage.setItem("usuarioturnos", JSON.stringify(turnos));
}

function eliminarTurnoEnSession(id) {
    let turnos = JSON.parse(sessionStorage.getItem("usuarioturnos")) || [];
    const nuevos = turnos.filter(t => t.id !== id);
    sessionStorage.setItem("usuarioturnos", JSON.stringify(nuevos));
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
        const resp = await fetch(`${BACKEND_URL}/users/turnos`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                estado_turno: nuevoEstado,
                recordatorio: null
            })
        });

        // ⛔ SI EL BACK DEVUELVE ERROR
        await manejarErrorRespuesta(resp, "Error al actualizar turno");

        const turnoActualizado = await resp.json();

        // Guardar EXACTO en sessionStorage
        reemplazarTurnoEnSession(turnoActualizado);

        // Adaptar y actualizar datosTurnos
        return actualizarDatosTurno(turnoActualizado);

    } catch (err) {
        console.error(err);
        alert("Hubo un error actualizando el turno.");
        return null;
    }
}

async function actualizarEstadosTurnos() {
    try {
        const resp = await fetch(`${BACKEND_URL}/users/turnos/estados`, {
            credentials: "include"
        });

        if (!resp.ok) {
            console.warn("No se pudieron actualizar los estados");
            return;
        }

        const estados = await resp.json();

        actualizarEstadosEnSession(estados)

        // Reemplazar estados dentro de datosTurnos
        estados.forEach(est => {
            const idx = datosTurnos.findIndex(t => t.id === est.id);
            if (idx !== -1) {
                datosTurnos[idx].estado = est.estado;
                actualizarTarjeta(datosTurnos[idx]);
            }
        });

    } catch (err) {
        console.error("Error al actualizar estados:", err);
    }
}

function actualizarEstadosEnSession(estados) {
    let guardados = JSON.parse(sessionStorage.getItem("usuarioturnos")) || [];

    estados.forEach(e => {
        const idx = guardados.findIndex(t => t.id === e.id);
        if (idx !== -1) {
            guardados[idx].estado = e.estado;
        }
    });

    sessionStorage.setItem("usuarioturnos", JSON.stringify(guardados));
}

// ========================================
//     ELIMINAR TURNO → envia a historial
// ========================================
async function eliminarTurno(id) {
    try {
        const resp = await fetch(`${BACKEND_URL}/users/turnos/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        // ⛔ SI EL BACK DEVUELVE ERROR
        await manejarErrorRespuesta(resp, "Error al eliminar turno");

        const data = await resp.json();

        const idEliminado = data.turno_id;

        // eliminar de sessionStorage
        eliminarTurnoEnSession(idEliminado);

        datosTurnos = datosTurnos.filter(t => t.id !== idEliminado);

        // Adaptar y actualizar datosTurnos
        return idEliminado

    } catch (err) {
        console.error(err);
        alert("Hubo un error eliminando el turno.");
        return null;
    }
}

// ========================================
//     CALIFICACIÓN (1 al 10)
// ========================================

function abrirModalCalificacion(id) {
    turnoIdCalificando = id
    calificacionSeleccionada = null;

    const cont = document.querySelector(".calificacion-numeros");
    cont.innerHTML = "";

    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement("button");
        btn.classList.add("cal-btn");
        btn.innerText = i;

        btn.onclick = () => {
            document.querySelectorAll(".cal-btn")
                .forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            calificacionSeleccionada = i;
        };

        cont.appendChild(btn);
    }

    document.getElementById("calificacionModal").style.display = "flex";
}

async function enviarCalificacion() {
    if (!calificacionSeleccionada) {
        alert("Selecciona un puntaje antes de continuar.");
        return;
    }

    const turno = datosTurnos.find(t => t.id === turnoIdCalificando);
    if (!turno) return;

    try {
        // 1️⃣ Enviar calificación al backend
        const resp = await fetch(`${BACKEND_URL}/calificacion`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                empresa_id: turno.empresa_id,
                valor: calificacionSeleccionada
            })
        });
        
        // ⛔ SI EL BACK DEVUELVE ERROR
        await manejarErrorRespuesta(resp, "No se pudo guardar la calificación");

        const data = await resp.json();
        console.log("Respuesta del backend:", data);

        // 2️⃣ Si el backend confirmó, recién ahora marcás el turno como cumplido
        const turnoActualizado = await actualizarEstadoTurno(turno.id, "cumplido");
        if (!turnoActualizado) return;

        // 3️⃣ Actualizar UI
        actualizarTarjeta(turnoActualizado);

        cerrarCalificacion();

        alert("¡Gracias por tu calificación!");

        cerrarDetalleTurno();
        mostrarDetalleTurno(turnoActualizado.id);

    } catch (error) {
        console.error("Error al enviar calificación:", error);
        alert("Error de conexión.");
    }
}

function cerrarCalificacion() {
    document.getElementById("calificacionModal").style.display = "none";
}

// ========================================
//     CONTACTAR POR WHATSAPP
// ========================================
function contactarWhatsapp(id) {
    const turno = datosTurnos.find(t => t.id === id);
    if (!turno) return;

    const numero = "5491122334455";
    const mensaje = `Hola, tengo una consulta sobre mi turno de ${turno.servicio}.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`);
}

// ========================================
//     MOSTRAR UBICACIÓN
// ========================================
function mostrarUbicacion(lat, lng) {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
}

// ========================================
//     RECORDATORIO
// ========================================

function abrirRecordatorio(id) {
    turnoRecordatorioSeleccionado = id;

    const turno = datosTurnos.find(t => t.id === id);

    // Si el turno tiene recordatorio, pre-cargar valores
    if (turno) {
        document.getElementById("horasRecordatorio").value =
            turno.recordatorio_horas ?? 0;

        document.getElementById("minutosRecordatorio").value =
            turno.recordatorio_minutos ?? 0;
    }

    document.getElementById('recordatorioModal').style.display = 'flex';
}

async function guardarRecordatorioNuevo() {
    const horas = parseInt(document.getElementById("horasRecordatorio").value);
    const minutos = parseInt(document.getElementById("minutosRecordatorio").value);

    // Validación correcta
    if (isNaN(horas) || horas < 0 || horas > 23) {
        alert("Las horas deben estar entre 0 y 23.");
        return;
    }

    if (minutos !== 0 && minutos !== 30) {
        alert("Solo se permite elegir 0 o 30 minutos.");
        return;
    }

    const turno = datosTurnos.find(t => t.id === turnoRecordatorioSeleccionado);
    if (!turno) return;

    try {
        const resp = await fetch(`${BACKEND_URL}/users/turnos`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: turnoRecordatorioSeleccionado,
                estado_turno: null,
                recordatorio: horas * 60 + minutos
            })
        });

        // ⛔ SI EL BACK DEVUELVE ERROR
        await manejarErrorRespuesta(resp, "Error al actualizar recordatorio");

        const turnoActualizado = await resp.json();

        // Guardar EXACTO en sessionStorage
        reemplazarTurnoEnSession(turnoActualizado);

        // Adaptar y actualizar datosTurnos
        const turnoAdaptado = actualizarDatosTurno(turnoActualizado);

        cerrarRecordatorio();
        abrirRecordatorio(turnoAdaptado.id)

    } catch (err) {
        console.error(err);
        alert("Hubo un error actualizando el turno.");
        return null;
    }

}

function cerrarRecordatorio() {
    document.getElementById("recordatorioModal").style.display = "none";
}

setInterval(() => {
    datosTurnos = datosTurnos.map(t => ({
        ...t,
        tiempoRestante: calcularTiempoRestante(t.fechaOriginal, t.duracion)
    }));
    renderizarTarjetas();
}, 60000);  // cada 1 minuto

// Actualiza estados cada 5 minutos
setInterval(actualizarEstadosTurnos, 5 * 60 * 1000);

/*
// ========================================
//     RENDERIZAR TARJETAS
// ========================================
function renderizarTarjetas() {
    const contenedor = document.getElementById('cardsContainer');
    if (!contenedor) return;

    contenedor.innerHTML = "";
    let turnos = datosTurnos;

    // búsqueda
    if (estadoApp.busqueda.trim()) {
        const b = estadoApp.busqueda.toLowerCase();
        turnos = turnos.filter(t =>
            t.nombre_de_servicio.toLowerCase().includes(b) ||
            t.empresa.toLowerCase().includes(b)
        );
    }

    if (turnos.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center; padding:30px; color:#777;">No se encontraron turnos</div>`;
        return;
    }

    turnos.forEach(t => contenedor.appendChild(crearTarjeta(t)));
}
*/