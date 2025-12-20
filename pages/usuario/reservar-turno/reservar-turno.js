import { BACKEND_URL, manejarErrorRespuesta, formatearFecha } from "../../../config.js";

const params = new URLSearchParams(window.location.search);
const empresaId = Number(params.get("id"));

/* VARIABLES DE SELECCIÓN */
let servicioConProfesionalSeleccionado = null;
let serviciosSeleccionados = null;
let fechaSeleccionada = null;
let horaSeleccionada = null;
let profesionalIndiferente = false;

let datosServicios = [];
let pasoActual = 1;

function obtenerRangosOcupados(turnosActuales) {
    return turnosActuales.map(t => ({
        inicio: t.inicio,
        fin: t.fin
    }));
};

function normalizarDia(dia) {
    return dia
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

function obtenerDisponibilidadesDelDia(servicio, fechaSeleccionada) {
    const [year, month, day] = fechaSeleccionada.split("-").map(Number);

    const diaSemana = normalizarDia(
        new Date(year, month - 1, day)
            .toLocaleDateString("es-AR", { weekday: "long" })
    );

    console.log("Dia calculado:", diaSemana);
    console.log("Disponibilidades del servicio:", servicio.disponibilidades.map(d => normalizarDia(d.dia)));

    return servicio.disponibilidades.filter(d =>
        normalizarDia(d.dia) === diaSemana
    );
};

function estaHoraOcupada(fechaISO, hora, rangosOcupados, duracionServicio) {
    const [year, month, day] = fechaISO.split("-").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const inicio = new Date(year, month-1, day, hh, mm);

    const fin = new Date(inicio);
    fin.setMinutes(fin.getMinutes() + duracionServicio);

    return rangosOcupados.some(r =>
        inicio < r.fin && fin > r.inicio
    );
};
/*
function calcularHorariosDisponibles(servicio, fechaSeleccionada) {
    console.log("🚀 calcularHorariosDisponibles EJECUTADO");
    console.log("servicio recibido:", servicio);
    console.log("🧪 Servicio:", servicio.nombre);
    console.log("Profesional ID:", servicio.profesional_id);
    console.log("Disponibilidades:", servicio.disponibilidades);
    console.log("Turnos actuales:", servicio.turnos_actuales);
    //const rangosOcupados = obtenerRangosOcupados(servicio.turnos_actuales);
    const disponibilidadesDia = obtenerDisponibilidadesDelDia(servicio, fechaSeleccionada);
    console.log("📦 disponibilidades del día:", disponibilidadesDia);

    return disponibilidadesDia.filter(d => {
        // Contamos cuántos turnos ya hay en esta fecha y hora
        const turnosEnHora = servicio.turnos_actuales.filter(t => {
            const tFecha = t.inicio.toISOString().split("T")[0]; // "YYYY-MM-DD"
            const tHora = t.inicio.toLocaleTimeString("es-AR", {hour: "2-digit", minute: "2-digit"});
            return tFecha === fechaSeleccionada && tHora === d.hora;
        }).length;

        // Solo permitimos la disponibilidad si no supera cant_turnos_max
        console.log("Hora disponible:", d.hora, "Turnos en esa hora:", turnosEnHora);

        //const ocupada = estaHoraOcupada(fechaSeleccionada, d.hora, rangosOcupados, servicio.duracion);
        //console.log("Está ocupada?", ocupada);

        return turnosEnHora < Number(d.cant_turnos_maxs); // && !ocupada;
    });
};
*/

function calcularHorariosDisponibles(servicio, fechaSeleccionada) {
    console.log("🚀 calcularHorariosDisponibles EJECUTADO");
    console.log("Servicio recibido:", servicio.nombre, "Profesional ID:", servicio.profesional_id);

    const rangosOcupados = obtenerRangosOcupados(servicio.turnos_actuales);
    const disponibilidadesDia = obtenerDisponibilidadesDelDia(servicio, fechaSeleccionada);
    console.log("📦 Disponibilidades del día:", disponibilidadesDia);

    const horariosDisponibles = [];

    for (const disponibilidad of disponibilidadesDia) {

        // ⏰ BLOQUEO TURNOS PASADOS
        const [y, m, d] = fechaSeleccionada.split("-").map(Number);
        const [hh, mm] = disponibilidad.hora.split(":").map(Number);
        const fechaHoraTurno = new Date(y, m - 1, d, hh, mm);

        if (fechaHoraTurno <= new Date()) continue;
        // Contamos cuántos turnos ya hay en esta fecha y hora
        const turnosEnHora = servicio.turnos_actuales.filter(t => {
            const y = t.inicio.getFullYear();
            const m = String(t.inicio.getMonth() + 1).padStart(2, "0");
            const d = String(t.inicio.getDate()).padStart(2, "0");
            const tFecha = `${y}-${m}-${d}`;
            const tHora = t.inicio.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            return tFecha === fechaSeleccionada && tHora === disponibilidad.hora;
        }).length;

        console.log("Hora:", disponibilidad.hora, "Turnos en esa hora:", turnosEnHora);

        // Verificamos si el rango está ocupado
        const ocupada = estaHoraOcupada(fechaSeleccionada, disponibilidad.hora, rangosOcupados, servicio.duracion);
        // console.log("Está ocupada?", ocupada);

        // Agregamos solo si hay espacio
        const puedeReservar = turnosEnHora < Number(disponibilidad.cant_turnos_max) && !ocupada;

        // console.log("se puede reservar?", puedeReservar, turnosEnHora, disponibilidad.cant_turnos_max);
        if (puedeReservar) {
            console.log(disponibilidad);
            horariosDisponibles.push(disponibilidad);
        }
    }
    console.log("Horarios Disponibles OK", horariosDisponibles);

    return horariosDisponibles;
};

function calcularHorariosCualquiera(servicios, fechaSeleccionada) {
    const horasSet = new Set();

    servicios.forEach(servicio => {
        const horarios = calcularHorariosDisponibles(
            servicio,
            fechaSeleccionada
        );

        horarios.forEach(h => horasSet.add(h.hora));
    });

    return Array.from(horasSet)
        .sort()
        .map(hora => ({ hora }));
};

/* ============================================================
   INICIALIZAR
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    await cargarTurnosDisponibles(empresaId);
    // 1️⃣ Cargar turnos desde sessionStorage
    const serviciosGuardados = sessionStorage.getItem(`servicios_de_empresa${empresaId}`);

    if (serviciosGuardados) {
        const serviciosAPI = JSON.parse(serviciosGuardados);
        datosServicios = serviciosAPI.map(adaptarServicio);
    };

    renderizarServicios();
    mostrarPaso(1);

    document.getElementById("btnConfirmarReserva").addEventListener("click", aceptarTurno);
});

async function cargarTurnosDisponibles(empresaId) {
    try {
        const servicios = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/users/empresas/${empresaId}/turnos_disponibles`, {
                method: "GET",
                credentials: "include"
            }),
            "No se pudieron cargar los turnos disponibles"
        );

        sessionStorage.setItem(`servicios_de_empresa${empresaId}`, JSON.stringify(servicios));

    } catch (err) {
        console.error(err);
    }
}

function formatearTurnosActuales(turnos) {
    return turnos.map(t => {
        const inicio = new Date(t.fecha_hora);
        const fin = new Date(inicio.getTime() + (t.duracion ?? 0) * 60000);

        return {
            id: t.id,
            inicio: inicio,
            fin: fin,
            fecha: formatearFecha(inicio),
            hora: inicio.toLocaleTimeString("es-AR", {hour: "2-digit", minute: "2-digit"}), // "HH:MM"
            fechaOriginal: t.fecha_hora
        }
    })
}

// ==============================
//  ADAPTAR SERVICIO PARA EL FRONT
// ==============================
function adaptarServicio(ser) {

    return {
        id: ser.id,
        nombre: ser.nombre,
        duracion: ser.duracion ?? 0,
        precio: ser.precio,
        aclaracion: ser.aclaracion,
        profesional_id: ser.profesional_id,
        profesional_dni: ser.profesional_dni,
        profesional: `${ser.profesional_apellido}, ${ser.profesional_nombre}`,
        disponibilidades: ser.disponibilidades,
        turnos_actuales: formatearTurnosActuales(ser.turnos_actuales)
    };
}

/* ============================================================
   INDICADORES SUPERIORES DE PASOS
============================================================ */
function actualizarIndicadorPasos() {
    const indicadores = document.querySelectorAll("#indicadorPasos .flex-1 div");

    indicadores.forEach((indi, index) => {
        if (index === pasoActual - 1) {
            indi.classList.remove("bg-gray-300", "text-gray-600");
            indi.classList.add("bg-[#AC0505]", "text-white");
        } else if (index < pasoActual - 1) {
            indi.classList.remove("bg-gray-300", "text-gray-600");
            indi.classList.add("bg-green-600", "text-white");
        } else {
            indi.classList.remove("bg-[#AC0505]", "text-white", "bg-green-600");
            indi.classList.add("bg-gray-300", "text-gray-600");
        }
    });

    const lineas = document.querySelectorAll(".linea-indicadora");
    lineas.forEach((linea, index) => {
        if (index < pasoActual - 1) linea.classList.add("activo");
        else linea.classList.remove("activo");
    });
}

function mostrarPaso(n) {
    console.log("➡️ mostrarPaso:", n);
    pasoActual = n;
    document.querySelectorAll("section[id^='paso-']").forEach(sec => sec.classList.add("hidden"));

    if (n === 1) {
        document.getElementById("paso-servicio").classList.remove("hidden");
        // Reinicializar selección de servicios
        serviciosSeleccionados = null;
        servicioConProfesionalSeleccionado = null;
        profesionalIndiferente = false;
    };
    if (n === 2) {
        document.getElementById("paso-profesional").classList.remove("hidden");
    };
    if (n === 3) {
        console.log("📅 Entrando a paso 3");
        console.log("serviciosSeleccionados:", serviciosSeleccionados);
        console.log("servicioConProfesionalSeleccionado:", servicioConProfesionalSeleccionado);
        console.log("profesionalIndiferente:", profesionalIndiferente);
        document.getElementById("paso-hora").classList.remove("hidden");
        fechaSeleccionada = null;
        horaSeleccionada = null;
        prepararCalendario();
    };
    if (n === 4) document.getElementById("paso-resumen").classList.remove("hidden");

    actualizarIndicadorPasos();
}

window.siguientePaso = function () {
    if (pasoActual === 1) {
        if (!serviciosSeleccionados || serviciosSeleccionados.length === 0) return;

        // 👉 si hay más de un servicio igual → elegir profesional
        if (serviciosSeleccionados.length > 1) {
            renderizarProfesionales(serviciosSeleccionados);
            mostrarPaso(2);
        } 
        // 👉 si hay uno solo → saltear profesionales
        else {
            servicioConProfesionalSeleccionado = serviciosSeleccionados[0];
            mostrarPaso(3);
        }
    }
    else if (pasoActual === 2) {
        if (!profesionalIndiferente && !servicioConProfesionalSeleccionado) return;
        mostrarPaso(3);
    }
    else if (pasoActual === 3) {
        if (!fechaSeleccionada || !horaSeleccionada) return;
        renderizarResumen();
        mostrarPaso(4);
    }
};

window.pasoAnterior = function () {
    if (pasoActual === 3) {
        // Si NO hubo elección de profesional → volver a servicios
        if (!serviciosSeleccionados || serviciosSeleccionados.length === 1) {
            mostrarPaso(1);
            return;
        }
    }

    if (pasoActual > 1) {
        mostrarPaso(pasoActual - 1);
    }

};

/* ============================================================
   PASO 1 – SERVICIOS
============================================================ */
function agruparServicios(servicios) {
    const mapa = {};

    servicios.forEach(s => {
        const key = `${s.nombre}|${s.duracion}|${s.precio}`;
        if (!mapa[key]) mapa[key] = [];
        mapa[key].push(s);
    });

    return Object.values(mapa);
}

function renderizarServicios() {
    const cont = document.getElementById("listaServicios");
    const grupos = agruparServicios(datosServicios);

    cont.innerHTML = grupos.map((grupo, index) => {
        const s = grupo[0]; // servicio representativo

        return `
            <div class="tarjeta-servicio bg-white border-2 border-gray-200 rounded-lg p-5 cursor-pointer"
                 onclick="seleccionarServicioGrupo(${index}, event)">
                <h3 class="font-bold text-gray-800 text-lg">${s.nombre}</h3>
                <p class="text-sm text-gray-500 mt-2">⏱ ${s.duracion} min</p>
                <p class="text-base font-semibold text-[#AC0505] mt-3">$ ${s.precio}</p>
            </div>
        `;
    }).join("");

    window._gruposServicios = grupos; // guardamos los grupos
}

window.seleccionarServicioGrupo = (index, e) => {
    document.querySelectorAll(".tarjeta-servicio").forEach(c => c.classList.remove("seleccionado"));

    e.currentTarget.classList.add("seleccionado");

    const grupo = window._gruposServicios[index];

    serviciosSeleccionados = grupo; // ahora es un ARRAY

    servicioConProfesionalSeleccionado = null;
    profesionalIndiferente = false;
    document.getElementById("btnSiguienteServicio").disabled = false;
};


/* ============================================================
   PASO 2 – PROFESIONALES
============================================================ */
function renderizarProfesionales(grupoServicios) {
    const cont = document.getElementById("listaProfesionales");

    cont.innerHTML = `
        <div class="tarjeta-profesional bg-white border-2 border-dashed border-[#AC0505] rounded-lg p-5 cursor-pointer"
             onclick="seleccionarCualquiera(event)">
            <h3 class="font-bold text-[#AC0505]">⭐ Cualquiera disponible</h3>
            <p class="text-sm text-gray-600">
                Te asignamos el primero que tenga turno
            </p>
        </div>
    `;

    cont.innerHTML += grupoServicios.map(s => `
        <div class="tarjeta-profesional bg-white border-2 border-gray-200 rounded-lg p-5 cursor-pointer"
             onclick="seleccionarProfesional(${s.id}, event)">
            <h3 class="font-bold text-gray-800">${s.profesional}</h3>
        </div>
    `).join("");

    document.getElementById("btnSiguienteProfesional").disabled = true;
}

window.seleccionarProfesional = (id, e) => {
    document.querySelectorAll(".tarjeta-profesional").forEach(c => c.classList.remove("seleccionado"));

    e.currentTarget.classList.add("seleccionado");

    servicioConProfesionalSeleccionado = serviciosSeleccionados.find(s => s.id === id);
    profesionalIndiferente = false;

    document.getElementById("btnSiguienteProfesional").disabled = false;
};

window.seleccionarCualquiera = (e) => {
    document.querySelectorAll(".tarjeta-profesional")
        .forEach(c => c.classList.remove("seleccionado"));

    e.currentTarget.classList.add("seleccionado");

    servicioConProfesionalSeleccionado = null;
    profesionalIndiferente = true;

    document.getElementById("btnSiguienteProfesional").disabled = false;
};


/* ============================================================
   PASO 3 – FECHA Y HORA 
============================================================ */

let diasCalendario = [];
let disponibilidadDias = {};
let indiceSemanaActual = 0;
let maxSemana = 0;

/* Genera 56 días + disponibilidad según turnos actuales y cant_turnos_max */
function generarDiasCalendario() {
    const hoy = new Date();
    diasCalendario = [];
    disponibilidadDias = {};

    for (let i = 0; i < 56; i++) {  // 56 días
        console.log("profesionalIndiferente:", profesionalIndiferente);
        console.log("serviciosSeleccionados:", serviciosSeleccionados);
        console.log("servicioConProfesionalSeleccionado:", servicioConProfesionalSeleccionado);
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);

        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");
        const day = String(fecha.getDate()).padStart(2, "0");
        const iso = `${year}-${month}-${day}`;

        console.log("🗓️ evaluando fecha:", iso);

        const diaSemana = fecha.toLocaleString("es-ES", { weekday: "short" }).toUpperCase();
        const mesLower = fecha.toLocaleString("es-ES", { month: "short" }).toLowerCase();

        diasCalendario.push({
            fechaISO: iso,
            dia: fecha.getDate(),
            mes: mesLower,
            diaSemana: diaSemana
        });

        // Chequeamos si hay al menos un horario disponible para esta fecha y que respete cant_turnos_max
        let tieneHorarios = false;

        if (profesionalIndiferente && serviciosSeleccionados) {
            console.log("🟡 Calculando horarios CUALQUIERA");
            // Si el usuario eligió "cualquier profesional", calculamos los horarios combinados
            const horarios = calcularHorariosCualquiera(serviciosSeleccionados, iso);
            if (horarios.length > 0) {
                tieneHorarios = true;
            }
        } else if (servicioConProfesionalSeleccionado) {
            console.log("🟢 Calculando horarios SERVICIO ÚNICO / PROFESIONAL");
            console.log("👉 Servicio usado:", servicioConProfesionalSeleccionado);
            // Si eligió un profesional específico o un servicio sin profesional, usamos solo ese servicio
            const horarios = calcularHorariosDisponibles(servicioConProfesionalSeleccionado, iso);
            console.log("🟡 long de horarios", horarios.length);
            console.log("🟡 horarios", horarios);
            if (horarios.length > 0) {
                tieneHorarios = true;
            }
        };

        disponibilidadDias[iso] = tieneHorarios;

        maxSemana = Math.ceil(diasCalendario.length / 7) - 1;  
    }
};

/* Preparar calendario */
function prepararCalendario() {
    generarDiasCalendario();

    fechaSeleccionada = null;
    horaSeleccionada = null;
    indiceSemanaActual = 0;

    document.getElementById("listaHoras").innerHTML = "";
    document.getElementById("mensaje-disponibilidad").textContent =
        "Selecciona una fecha para ver los horarios disponibles.";

    document.getElementById("btnSiguienteHora").disabled = true;

    renderSemanaActual();
};

/* Pintar semana actual */
function renderSemanaActual() {
    const cont = document.getElementById("listaFechas");
    const inicio = indiceSemanaActual * 7;
    const fin = inicio + 7;
    const semana = diasCalendario.slice(inicio, fin);

    let html = `<div class="fechas-wrapper">`;

    html += `
        <button class="nav-fecha" onclick="cambiarSemana(-1)" ${indiceSemanaActual === 0 ? "disabled" : ""}>
            «
        </button>
    `;

    semana.forEach(d => {
        const disponible = disponibilidadDias[d.fechaISO];
        const activo = fechaSeleccionada === d.fechaISO;

        const clases = ["boton-fecha"];
        if (disponible) clases.push("disponible");
        else clases.push("sin-turnos");
        if (activo) clases.push("seleccionado");

        const clickAttr = disponible
            ? `onclick="seleccionarFecha('${d.fechaISO}', event)"`
            : "";

        html += `
            <button class="${clases.join(" ")}" ${clickAttr}>
                <span class="fecha-mes">${d.mes}</span>
                <span class="fecha-dia-semana">${d.diaSemana}</span>
                <span class="fecha-dia-numero">${d.dia}</span>
            </button>
        `;
    });

    html += `
        <button class="nav-fecha" onclick="cambiarSemana(1)" ${indiceSemanaActual === maxSemana ? "disabled" : ""}>
            »
        </button>
    `;

    html += `</div>`;

    cont.innerHTML = html;
};

/* Cambiar semana */
window.cambiarSemana = function (delta) {
    const nuevo = indiceSemanaActual + delta;
    if (nuevo < 0 || nuevo > maxSemana) return;

    indiceSemanaActual = nuevo;
    renderSemanaActual();
};

/* Seleccionar fecha */
window.seleccionarFecha = (fechaISO, e) => {
    if (!disponibilidadDias[fechaISO]) {
        fechaSeleccionada = null;
        horaSeleccionada = null;
        document.getElementById("listaHoras").innerHTML = "";
        document.getElementById("mensaje-disponibilidad").textContent =
            "No hay horarios disponibles para este día.";
        document.getElementById("btnSiguienteHora").disabled = true;
        return;
    }

    fechaSeleccionada = fechaISO;

    document.querySelectorAll(".boton-fecha").forEach(b => b.classList.remove("seleccionado"));
    if (e && e.currentTarget) e.currentTarget.classList.add("seleccionado");

    document.getElementById("mensaje-disponibilidad").textContent =
        "Selecciona un horario disponible:";

    renderHorariosParaFecha();
};

function renderHorariosParaFecha() {
    const cont = document.getElementById("listaHoras");

    let horariosDisponibles;

    if (profesionalIndiferente) {
        horariosDisponibles = calcularHorariosCualquiera(
            serviciosSeleccionados,
            fechaSeleccionada
        );
    } else {
        horariosDisponibles = calcularHorariosDisponibles(
            servicioConProfesionalSeleccionado,
            fechaSeleccionada
        );
    }

    if (horariosDisponibles.length === 0) {
        cont.innerHTML = "<p>No hay horarios disponibles para este día.</p>";
        return;
    };

    horariosDisponibles.sort((a, b) => {
        const [h1, m1] = a.hora.split(":").map(Number);
        const [h2, m2] = b.hora.split(":").map(Number);
        return h1 * 60 + m1 - (h2 * 60 + m2);
    });

    cont.innerHTML = horariosDisponibles.map(d => `
        <button class="boton-hora"
                onclick="seleccionarHora('${d.hora}', event)">
            ${d.hora}
        </button>
    `).join("");

    horaSeleccionada = null;
    document.getElementById("btnSiguienteHora").disabled = true;
};

window.seleccionarHora = (h, e) => {
    horaSeleccionada = h;

    document.querySelectorAll(".boton-hora").forEach(b => b.classList.remove("seleccionado"));
    if (e && e.currentTarget) e.currentTarget.classList.add("seleccionado");

    document.getElementById("btnSiguienteHora").disabled = false;
};

/* ============================================================
   PASO 4 – RESUMEN
============================================================ */
function renderizarResumen() {
    const servicio = servicioConProfesionalSeleccionado 
                     || (serviciosSeleccionados && serviciosSeleccionados[0]); // tomamos uno representativo
    const profesional = profesionalIndiferente 
                        ? "Cualquiera disponible" 
                        : (servicio?.profesional || "");
    const fecha = formatearFecha(fechaSeleccionada);

    document.getElementById("resumen-servicio").textContent = servicio?.nombre || "-";
    document.getElementById("resumen-precio").textContent = servicio?.precio ? `$ ${servicio.precio}` : "-";
    document.getElementById("resumen-profesional").textContent = profesional;
    document.getElementById("resumen-fecha").textContent = fecha || "-";
    document.getElementById("resumen-hora").textContent = horaSeleccionada || "-";
};

/* ============================================================
   MODAL CONFIRMACIÓN
============================================================ */
window.mostrarModalReserva = function () {
    const servicio = servicioConProfesionalSeleccionado 
                     || (serviciosSeleccionados && serviciosSeleccionados[0]); // tomamos uno representativo

    let profesionalTexto = '—';
    if (profesionalIndiferente) {
        profesionalTexto = "Cualquiera disponible";
    };
    if (servicio.profesional_apellido) {
        profesionalTexto = `${servicio.profesional_apellido}, ${servicio.profesional_nombre}`;
    };

    const fecha = formatearFecha(fechaSeleccionada);

    document.getElementById("modalReserva").style.display = "flex";

    document.getElementById("modal-resumen-servicio").textContent = servicio?.nombre || '—';
    document.getElementById("modal-resumen-profesional").textContent = profesionalTexto;
    document.getElementById("modal-resumen-fechahora").textContent =
        `${fecha} - ${horaSeleccionada}`;
    document.getElementById("precioConfirmado").textContent = servicio?.precio ? `$ ${servicio.precio}` : '—';
};

window.cerrarModalReserva = function (irAMisTurnos = false) {
    document.getElementById("modalReserva").style.display = "none";

    if (irAMisTurnos) {
        window.location.href = '../../usuario/home-usuario/home-usuario.html';
    }
};

async function aceptarTurno() {
    const turno = {
        empresa_id: empresaId, // asumiendo que tienes la empresa seleccionada
        fecha_hora: `${fechaSeleccionada}T${horaSeleccionada}`, // datetime completo
        servicio_id: servicioConProfesionalSeleccionado?.id || serviciosSeleccionados[0]?.id,
        profesional_id: profesionalIndiferente ? 0 : (servicioConProfesionalSeleccionado?.profesional_id || null)
    };

    try {
        const data = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/users/turnos`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(turno)
            }),
            "No se pudO reservar su turno"
        );

        if (data.turno) {
            // Leer los turnos existentes
            let turnos = JSON.parse(sessionStorage.getItem("usuarioturnos")) || [];

            // Agregar el nuevo turno
            turnos.push(data.turno);

            // Guardar de nuevo
            sessionStorage.setItem("usuarioturnos", JSON.stringify(turnos));

            // Mostramos el modal con la info del turno
            mostrarModalReserva();
        } else {
            // No llegó turno, mostramos el mensaje del backend
            alert(data.message || "No se pudo reservar el turno");
        }
    } catch (err) {
        console.error(err);
        alert("Error al reservar el turno");
    }
};