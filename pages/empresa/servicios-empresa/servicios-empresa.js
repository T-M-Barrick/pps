import { BACKEND_URL, manejarErrorRespuesta} from "../../../config.js";

const empresaId = sessionStorage.getItem("empresa_activa_id");

if (!empresaId) {
    // No hay empresa seleccionada → redirigir
    window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
};

// ELEMENTOS DEL DOM
const listaServicios = document.getElementById("listaServicios");

// Modal agregar/editar 
const modalServicio = document.getElementById("modalServicio");
const tituloModal = document.getElementById("tituloModal");

const campoNombre = document.getElementById("campoNombre");
const campoDuracion = document.getElementById("campoDuracion");
const profesionalSelect = document.getElementById("campoProfesionalSelect");
const profesionalTexto = document.getElementById("campoProfesionalTexto");
const campoPrecio = document.getElementById("campoPrecio");
const campoAclaracion = document.getElementById("campoAclaracion");

const diasContainer = document.getElementById("diasContainer");

const btnAbrirAgregar = document.getElementById("btnAbrirAgregar");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const btnGuardarModal = document.getElementById("btnGuardarModal");

// Modal eliminar
const modalEliminar = document.getElementById("modalEliminar");
const textoEliminar = document.getElementById("textoEliminar");
const btnCancelarEliminar = document.getElementById("btnCancelarEliminar");
const btnConfirmarEliminar = document.getElementById("btnConfirmarEliminar");

let servicioEditando = null;
let servicioEliminando = null;

let datosServicios = []
let miembros = []

document.addEventListener("DOMContentLoaded", async () => {
    const data = await cargarDatosDesdeBackend();

    if (data) {
        datosServicios = data
    };

    renderServicios(datosServicios);

    // EVENTOS GENERALES
    btnAbrirAgregar.onclick = abrirModalAgregar;
    btnCancelarModal.onclick = () => modalServicio.classList.remove("show");
    btnCancelarEliminar.onclick = () => modalEliminar.classList.remove("show");

    document.addEventListener("input", e => {
        if (e.target.classList.contains("input-int")) {
          e.target.value = e.target.value.slice(0, 3);
        };

        if (e.target.classList.contains("input-max")) {
          e.target.value = e.target.value.slice(0, 2);
        };

        if (!e.target.classList.contains("input-hora")) return;

        let v = e.target.value.replace(/[^\d:]/g, "");

        if (v.length === 2 && !v.includes(":")) {
            v += ":";
        };

        e.target.value = v.slice(0, 5);
    });
});

async function cargarDatosDesdeBackend() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.error("No se pudieron obtener los servicios de la empresa.");
            window.location.href = "../home-empresa/home-empresa.html";
            return;
        }

        const empresa = await respuesta.json();

        miembros = empresa.miembros;

        return empresa.servicios;

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../home-empresa/home-empresa.html";
    }
};

function crearInputHora(valor = "09:00") {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "HH:MM";
    input.value = valor;
    input.classList.add("input-hora");
    input.inputMode = "numeric";

    return input;
};

// RENDER DE TARJETAS 
function renderServicios(lista) {
    listaServicios.innerHTML = "";

    lista.forEach(serv => {
      const div = document.createElement("div");
      div.className = "servicio-card";

      const profesional = serv.profesional_apellido
          ? `${serv.profesional_apellido}, ${serv.profesional_nombre}`
          : "—";

      const dni = serv.profesional_dni || "—";

      
      div.innerHTML = `
        <div class="servicio-titulo">${serv.nombre}</div>
        
        <div class="servicio-dato">Profesional: ${profesional}</div>
        <div class="servicio-dato">DNI: ${dni}</div>
        <div class="servicio-dato">Duración: ${serv.duracion || "—"} min</div> 
        
        <div class="servicio-dato">Precio: $${serv.precio || "—"}</div>
        
        <div class="servicio-dato">Aclaración: ${serv.aclaracion || "—"}</div>

        <div class="servicio-acciones">
          <button class="btn-accion btn-editar">Editar</button>
          <button class="btn-accion btn-eliminar">Eliminar</button>
        </div>
      `;

      div.querySelector(".btn-editar").onclick = () => abrirModalEditar(serv);
      div.querySelector(".btn-eliminar").onclick = () => abrirModalEliminar(serv);

      listaServicios.appendChild(div);
    });
}

// SISTEMA DE DÍAS / HORARIOS
const diasSemana = [
    { key: "Lun", label: "Lun", laboral: true },
    { key: "Mar", label: "Mar", laboral: true },
    { key: "Mié", label: "Mié", laboral: true },
    { key: "Jue", label: "Jue", laboral: true },
    { key: "Vie", label: "Vie", laboral: true },
    { key: "Sáb", label: "Sáb", laboral: false },
    { key: "Dom", label: "Dom", laboral: false }
];

function crearGrupoIntervalo(container, desde = "09:00", hasta = "17:00", int = null, max = null) {
    const grupo = document.createElement("div");
    grupo.classList.add("intervalo-grupo"); 

    // Configuración (Int y Max)
    const configIntMax = document.createElement("div");
    configIntMax.classList.add("dia-config"); 

    const lblInt = document.createElement("span");
    lblInt.textContent = "Int:";

    const inputInt = document.createElement("input");
    inputInt.type = "number";
    inputInt.min = 1;
    inputInt.max = 999;
    inputInt.placeholder = "5";
    inputInt.classList.add("input-int");
    if (int !== null) inputInt.value = int;

    const lblMax = document.createElement("span");
    lblMax.textContent = "Max:";

    const inputMax = document.createElement("input");
    inputMax.type = "number";
    inputMax.min = 1;
    inputMax.max = 99;
    inputMax.placeholder = "1";
    inputMax.classList.add("input-max");
    if (max !== null) inputMax.value = max;

    configIntMax.append(lblInt, inputInt, lblMax, inputMax);

    // Horario (Desde/Hasta y Botón de Eliminar)
    const horarioFila = document.createElement("div");
    horarioFila.classList.add("intervalo"); 

    const selDesde = crearInputHora(desde);
    selDesde.classList.add("select-desde");

    const selHasta = crearInputHora(hasta);
    selHasta.classList.add("select-hasta");

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "-";
    btnEliminar.classList.add("btn-int");
    btnEliminar.onclick = () => grupo.remove(); // Elimina todo el grupo

    horarioFila.append(selDesde, selHasta, btnEliminar);
    grupo.append(configIntMax, horarioFila);
    container.appendChild(grupo);
};

function construirUIHorarios(horariosIniciales = null, esNuevo = false) {
    diasContainer.innerHTML = "";

    diasSemana.forEach(dia => {
      const card = document.createElement("div");
      card.classList.add("dia-card");
      card.dataset.dia = dia.key;

      const header = document.createElement("div");
      header.classList.add("dia-header");

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.classList.add("dia-checkbox");

      const lbl = document.createElement("label");
      lbl.textContent = dia.label;

      header.append(chk, lbl);

      const gruposContainer = document.createElement("div"); // Contenedor de grupos
      gruposContainer.classList.add("grupos-horarios-dia");

      // Valores iniciales
      let intervalosData = [];
      if (horariosIniciales && horariosIniciales[dia.key]) {
        intervalosData = horariosIniciales[dia.key];
      } else if (esNuevo && dia.laboral) {
        intervalosData = [{ desde: "09:00", hasta: "17:00" }];
      }

      if (intervalosData.length) {
        chk.checked = true;
        intervalosData.forEach(int => {
          crearGrupoIntervalo(gruposContainer, int.desde, int.hasta, int.int, int.max); // Crear grupo inicial
        });
      }

      // Botón de Agregar (+)
      const btnPlus = document.createElement("button");
      btnPlus.textContent = "+";
      btnPlus.classList.add("btn-plus-dia");
      btnPlus.onclick = () => {
        if (!chk.checked) chk.checked = true;
        crearGrupoIntervalo(gruposContainer); // Agrega un nuevo grupo completo
      };


      card.append(header, gruposContainer, btnPlus);
      diasContainer.appendChild(card);
    });
};

function leerHorariosDesdeUI() {
    const data = {};

    const cards = diasContainer.querySelectorAll(".dia-card");
    cards.forEach(card => {
      const diaKey = card.dataset.dia;
      const chk = card.querySelector(".dia-checkbox");
      const gruposContainer = card.querySelector(".grupos-horarios-dia"); 
      const grupos = [...gruposContainer.querySelectorAll(".intervalo-grupo")];

      if (!chk.checked || !grupos.length) return;

      
      const arr = grupos.map(grupo => ({
        // Lectura de Horario (Desde/Hasta)
        desde: grupo.querySelector(".select-desde").value,
        hasta: grupo.querySelector(".select-hasta").value,
        // Lectura de Int/Max
        int: Number(grupo.querySelector(".input-int").value) || null,
        max: Number(grupo.querySelector(".input-max").value) || null,
      }));

      data[diaKey] = arr;
    });

    return data;
};

function adaptarHorariosDesdeBackend(listaDisponibilidades) {
    const horarios = {};

    listaDisponibilidades.forEach(d => {
        const dia = d.dia;

        if (!horarios[dia]) {
            horarios[dia] = [];
        }

        horarios[dia].push({
            desde: d.hora_inicio.slice(0, 5), // "09:00"
            hasta: d.hora_fin.slice(0, 5),    // "17:00"
            int: d.intervalo,
            max: d.cant_turnos_max
        });
    });

    return horarios;
};

const MAPA_DIAS_BACKEND = {
    Lun: "lunes",
    Mar: "martes",
    "Mié": "miércoles",
    Jue: "jueves",
    Vie: "viernes",
    "Sáb": "sábado",
    Dom: "domingo"
};


function adaptarHorariosParaBackend(horariosUI) {
    const lista = [];

    if (Object.keys(horariosUI).length === 0) {
        throw new Error("Debe cargar al menos un horario");
    }

    Object.entries(horariosUI).forEach(([dia, intervalos]) => {
        intervalos.forEach(int => {

            if (!int.int) {
                throw new Error("El intervalo es obligatorio");
            };

            if (!int.max) {
                throw new Error("La cantidad máxima es obligatoria");
            };

            validarIntervalo(int.int);
            validarHora5Min(int.desde);
            validarHora5Min(int.hasta);
            validarOrdenHoras(int.desde, int.hasta);
            validarIntervaloHora(
                int.desde,
                int.hasta,
                int.int
            );

            lista.push({
                dia: MAPA_DIAS_BACKEND[dia], // va "lunes", "martes", etc.
                hora_inicio: `${int.desde}:00`,
                hora_fin: `${int.hasta}:00`,
                intervalo: int.int,
                cant_turnos_max: int.max
            });
        });
    });

    return lista;
};

function validarFormatoHora(hora) {
    if (!/^\d{2}:\d{2}$/.test(hora)) {
        throw new Error("La hora debe tener formato HH:MM");
    }

    const [h, m] = hora.split(":").map(Number);

    if (h < 0 || h > 23) {
        throw new Error("La hora debe estar entre 00 y 23");
    }

    if (m < 0 || m > 55) {
        throw new Error("Los minutos deben estar entre 00 y 55");
    }
};

function validarIntervalo(int) {
    if (!int || int <= 0 || int % 5 !== 0) {
        throw new Error("El intervalo debe ser múltiplo de 5");
    }
};

function validarHora5Min(horaHHMM) {
    validarFormatoHora(horaHHMM);

    const [, m] = horaHHMM.split(":").map(Number);

    if (m % 5 !== 0) {
        throw new Error("Los minutos deben ser múltiplo de 5");
    }
};

function validarOrdenHoras(desde, hasta) {
    if (hasta < desde) {
        throw new Error("La hora final debe ser mayor o igual que la hora inicial");
    }
};

function validarIntervaloHora(desde, hasta, intervalo) {
    const [h1, m1] = desde.split(":").map(Number);
    const [h2, m2] = hasta.split(":").map(Number);

    const minutosInicio = h1 * 60 + m1;
    const minutosFin = h2 * 60 + m2;

    const diff = minutosFin - minutosInicio;

    if (diff % intervalo !== 0) {
        throw new Error(
            `El rango ${desde}–${hasta} no coincide con la duración (${intervalo} min)`
        );
    };
};

/*
✅ Limpia el <select>
✅ Agrega opción “Sin asignar”
✅ Permite preseleccionar uno
✅ Se usa tanto para crear como para editar servicios
*/
function poblarProfesionalesSelect(miembroIdSeleccionado = null) {
    profesionalSelect.innerHTML = "";

    // Opción sin asignar
    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = "— Sin asignar —";
    profesionalSelect.appendChild(optEmpty);

    miembros.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = `${m.apellido}, ${m.nombre} (${m.rol})`;

        if (m.id === miembroIdSeleccionado) {
            opt.selected = true;
        }

        profesionalSelect.appendChild(opt);
    });
};

function abrirModalAgregar() {
    servicioEditando = null;
    tituloModal.textContent = "Agregar servicio";

    campoNombre.value = "";
    campoDuracion.value = "";
    campoPrecio.value = "";
    campoAclaracion.value = "";

    // Profesional
    poblarProfesionalesSelect();
    profesionalSelect.classList.remove("oculto");
    profesionalTexto.classList.add("oculto");
    profesionalTexto.value = "";

    // Horarios por defecto 
    construirUIHorarios(null, true);

    modalServicio.classList.add("show");
};

function abrirModalEditar(serv) {
    servicioEditando = serv;
    tituloModal.textContent = "Editar servicio";

    campoNombre.value = serv.nombre;
    campoDuracion.value = serv.duracion;
    campoPrecio.value = serv.precio;
    campoAclaracion.value = serv.aclaracion || "";

    // Mostrar select SIEMPRE
    poblarProfesionalesSelect(serv.profesional_id || null);
    profesionalSelect.classList.remove("oculto");
    profesionalTexto.classList.add("oculto");
    profesionalTexto.value = "";

    const horariosAdaptados = adaptarHorariosDesdeBackend(
        serv.disponibilidades || []
    );

    // Horarios
    construirUIHorarios(horariosAdaptados, false);

    modalServicio.classList.add("show");
};

// GUARDAR SERVICIO

btnGuardarModal.onclick = async () => {
    try {
        // 1️⃣ Leer y validar horarios desde la UI
        const horariosUI = leerHorariosDesdeUI();
        const horariosAdaptados = adaptarHorariosParaBackend(horariosUI);

        if (!campoNombre.value.trim()) {
            throw new Error("El nombre del servicio es obligatorio");
        };

        const duracionValor = campoDuracion.value
            ? Number(campoDuracion.value)
            : null;

        const precioValor = campoPrecio.value
          ? Number(campoPrecio.value)
          : null;
        
        const aclaracionValor = campoAclaracion.value.trim() || null;

        // 2️⃣ Profesional (puede ser null)
        const profesionalId = profesionalSelect.value
            ? Number(profesionalSelect.value)
            : null;

        // 3️⃣ Armar payload
        const data = {
            nombre: campoNombre.value.trim(),
            duracion: duracionValor,
            precio: precioValor,
            aclaracion: aclaracionValor,
            profesional_id: profesionalId,
            disponibilidades: horariosAdaptados
        };

        // 4️⃣ Crear o editar
        let empresa;

        if (servicioEditando) {
            data.id = servicioEditando.id;

            empresa = await manejarErrorRespuesta(
                await fetch(`${BACKEND_URL}/empresas/${empresaId}/servicios`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }),
                "No se pudo actualizar el servicio"
            );
        } else {
            empresa = await manejarErrorRespuesta(
                await fetch(`${BACKEND_URL}/empresas/${empresaId}/servicios`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }),
                "No se pudo crear el servicio"
            );
        }

        // 5️⃣ Actualizar estado local
        miembros = empresa.miembros;
        datosServicios = empresa.servicios;

        // 6️⃣ Cerrar modal y feedback
        modalServicio.classList.remove("show");

        alert(
            servicioEditando
                ? "Servicio actualizado correctamente"
                : "Servicio creado correctamente"
        );

        renderServicios(datosServicios);

    } catch (err) {
        // ❌ Errores de validación o backend
        alert(err.message || "Ocurrió un error inesperado");
    }
};

// MODAL ELIMINAR
function abrirModalEliminar(serv) {
    servicioEliminando = serv;
    textoEliminar.textContent = `¿Eliminar "${serv.nombre}"?`;
    modalEliminar.classList.add("show");
}

btnConfirmarEliminar.onclick = async () => {
    
    const data = {
        servicios: [servicioEliminando.id]
    };

    try {
        const empresa = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/empresas/${empresaId}/servicios`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }),
            "No se pudo eliminar el servicio"
        );

        datosServicios = datosServicios.filter(s => s.id !== servicioEliminando.id);

    } catch (err) {
        console.error(err);
    };

    modalEliminar.classList.remove("show");

    alert("Servicio eliminado correctamente")

    renderServicios(datosServicios);
    return;
};