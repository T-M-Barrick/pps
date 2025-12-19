import { BACKEND_URL, manejarErrorRespuesta} from "../../../config.js";

const empresaId = sessionStorage.getItem("empresa_activa_id");

if (!empresaId) {
    // No hay empresa seleccionada → redirigir
    window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
};

// DOM
const listaEmpleados = document.getElementById("listaEmpleados");
const btnInvitar = document.getElementById("btnInvitar");

let miembros = [];
let miembroSeleccionado = null;
let usuarioRol = null

// INICIO
document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosDesdeBackend();
});

async function cargarDatosDesdeBackend() {
    try {
        const res = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            console.error("No se pudieron obtener los miembros de la empresa.");
            window.location.href = "../home-empresa/home-empresa.html";
            return;
        }

        const data = await res.json();

        miembros = data.miembros;

        usuarioRol = data.rol

        renderizar(miembros, usuarioRol);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../home-empresa/home-empresa.html";
    }
};

// RENDER DE LISTA
function renderizar(miembros, rol) {
    listaEmpleados.innerHTML = "";
    const rolUsuario = rol;

    controlarPermisos(rolUsuario);

    miembros.forEach(emp => {
        const div = document.createElement("div");
        div.classList.add("empleado-card");

        div.innerHTML = `
           <div class="empleado-info">
            <span class="empleado-nombre">${emp.apellido}, ${emp.nombre}</span>
            <span class="empleado-dato">DNI: ${emp.dni}</span>
            <span class="empleado-dato">Email: ${emp.email}</span>
            <span class="empleado-rol">Rol: ${emp.rol}</span>
           </div>


            <div class="empleado-acciones">
                <button class="btn-accion btn-rol">
                    <i class="fa-solid fa-user-gear"></i> Rol
                </button>

                <button class="btn-accion btn-eliminar">
                    <i class="fa-solid fa-user-xmark"></i> Eliminar
                </button>
            </div>
        `;

        if (rolUsuario !== "propietario") {
            div.querySelector(".btn-rol").remove();
        };

        div.querySelector(".btn-rol")?.addEventListener(
            "click",
            () => abrirModalCambiarRol(emp, rolUsuario)
        );

        div.querySelector(".btn-eliminar")?.addEventListener(
            "click",
            () => abrirModalEliminar(emp, rolUsuario)
        );

        listaEmpleados.appendChild(div);
    });
}

// CONTROL PERMISOS
function controlarPermisos(rol) {

    // gerente — solo puede invitar “empleado”
    if (rol === "gerente") {
        const select = document.getElementById("selectRolInvitar");
        select.innerHTML = `<option value="empleado">Empleado</option>`;
    }
}

// MODAL INVITAR EMPLEADO
const modalInvitar = document.getElementById("modalInvitar");

const inputEmailInvitar = document.getElementById("inputEmailInvitar");
const selectRolInvitar = document.getElementById("selectRolInvitar");

btnInvitar.onclick = () => modalInvitar.classList.add("show");
document.getElementById("btnCancelarInvitacion").onclick =
    () => modalInvitar.classList.remove("show");

document.getElementById("btnEnviarInvitacion").onclick = async () => {

    const email = inputEmailInvitar.value.trim();
    const rolSel = selectRolInvitar.value;

    if (!email.includes("@")) {
        alert("Email inválido.");
        return;
    }

    if (usuarioRol === "empleado")
        return alert("Los empleados no pueden asignar roles.");

    if (usuarioRol === "gerente" && rolSel === "propietario")
        return alert("No tenés permisos para asignar este rol.");

    if (usuarioRol === "gerente" && rolSel === "gerente")
        return alert("No tenés permisos para asignar este rol.");

    const data = await manejarErrorRespuesta(
        await fetch(`${BACKEND_URL}/empresas/${empresaId}/invitaciones`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario_email: email,
                rol: rolSel
            })
        }),
        "Error al enviar invitación"
    );

    alert(data.message);
    modalInvitar.classList.remove("show");
    inputEmailInvitar.value = "";
};

// MODAL CAMBIAR ROL
const modalCambiarRol = document.getElementById("modalCambiarRol");

const cambiarRolNombre = document.getElementById("cambiarRolNombre");
const cambiarRolActual = document.getElementById("cambiarRolActual");
const cambiarRolNuevo = document.getElementById("cambiarRolNuevo");

function abrirModalCambiarRol(emp, rolUsuario) {

    if (rolUsuario === "empleado")
        return alert("Un empleado no puede cambiar roles.");

    if (rolUsuario === "gerente")
        return alert("Un gerente no puede cambiar roles.");

    if (emp.rol === "propietario")
        return alert("No se puede modificar el rol del propietario.");

    miembroSeleccionado = emp;

    cambiarRolNombre.textContent = `${emp.apellido}, ${emp.nombre}`;
    cambiarRolActual.value = emp.rol;

    // propietario puede asignar todos los roles
    cambiarRolNuevo.innerHTML = `
        <option value="propietario">Propietario</option>
        <option value="gerente">Gerente</option>
        <option value="empleado">Empleado</option>
    `;

    cambiarRolNuevo.value = emp.rol;

    modalCambiarRol.classList.add("show");
}

document.getElementById("btnCancelarCambioRol").onclick =
    () => modalCambiarRol.classList.remove("show");

document.getElementById("btnGuardarCambioRol").onclick = async () => {

    if (!miembroSeleccionado) return;

    const nuevoRol = cambiarRolNuevo.value;

    const data = await manejarErrorRespuesta(
        await fetch(
            `${BACKEND_URL}/empresas/${empresaId}/miembros/${miembroSeleccionado.id}`,
            {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify( {nuevo_rol: nuevoRol} )
            }
        ),
        "Error al modificar rol"
    );

    await cargarDatosDesdeBackend()

    alert(data.message);

    modalCambiarRol.classList.remove("show");
    miembroSeleccionado = null;
};

// MODAL ELIMINAR EMPLEADO
const modalEliminar = document.getElementById("modalEliminarEmpleado");
const textoEliminar = document.getElementById("textoEliminar");

function abrirModalEliminar(emp, rolUsuario) {

    if (rolUsuario === "empleado")
        return alert("No tenés permisos para eliminar empleados.");

    if (rolUsuario === "gerente" && emp.rol === "propietario")
        return alert("No tenés permisos para eliminar a empleados con este rol.");

    if (rolUsuario === "gerente" && emp.rol === "gerente")
        return alert("No tenés permisos para eliminar a empleados con este rol.");

    miembroSeleccionado = emp;

    textoEliminar.textContent = `¿Eliminar a ${emp.apellido}, ${emp.nombre}?`;

    modalEliminar.classList.add("show");
}

document.getElementById("btnCancelarEliminar").onclick =
    () => modalEliminar.classList.remove("show");

document.getElementById("btnConfirmarEliminar").onclick = async () => {

    if (!miembroSeleccionado) return;

    const data = await manejarErrorRespuesta(
        await fetch(
            `${BACKEND_URL}/empresas/${empresaId}/miembros/${miembroSeleccionado.id}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        ),
        "Error al eliminar miembro"
    );

    await cargarDatosDesdeBackend()

    alert(data.message);

    modalEliminar.classList.remove("show");
    miembroSeleccionado = null;
};
