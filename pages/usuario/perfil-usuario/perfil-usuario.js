import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

let datosUsuario = null

document.addEventListener("DOMContentLoaded", async () => {

    const provSelect = document.getElementById("provincia");
    const deptoSelect = document.getElementById("departamento");
    const locSelect = document.getElementById("localidad");
    const calleInput = document.getElementById("calle");
    const alturaInput = document.getElementById("altura");
    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    // --- Inicializar mapa ---
    const map = L.map('mapa').setView([-34.60, -58.38], 12);

    setTimeout(() => {
        map.invalidateSize();
    }, 1000);

    // También recalcular cuando se redimensiona la ventana
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    let marker = null;

    // --- Cargar datos del usuario desde sessionStorage ---
    cargarDatosUsuario();

    // --- Cargar domicilio desde backend si existe ---
    if (datosUsuario) {
        await cargarDomicilioDesdeBackend(provSelect, deptoSelect, locSelect, calleInput, alturaInput, datosUsuario);

        // Opcional: centrar mapa en la dirección del usuario
        if (datosUsuario.lat && datosUsuario.lng) {
            map.setView([datosUsuario.lat, datosUsuario.lng], 15);
            marker = L.marker([datosUsuario.lat, datosUsuario.lng]).addTo(map);
        }
    };

    // --- Eventos de selects ---
    provSelect.onchange = async () => {
        await cargarDepartamentos(deptoSelect, provSelect.value);
        locSelect.innerHTML = "<option value=''>Seleccione localidad</option>";
        locSelect.disabled = true;
    };

    deptoSelect.onchange = async () => {
        await cargarLocalidades(locSelect, provSelect.value, deptoSelect.value);
    };

    locSelect.addEventListener("change", async () => {
        const prov = encodeURIComponent(provSelect.value);
        const depto = encodeURIComponent(deptoSelect.value);
        const loc = encodeURIComponent(locSelect.value);

        const resp = await fetch(`${BACKEND_URL}/georef/coordenadas?provincia=${prov}&municipio=${depto}&localidad=${loc}`);
        const data = await resp.json();

        if (!data || !data.lat || !data.lng) return;

        map.setView([data.lat, data.lng], 15);
        if (!marker) marker = L.marker([data.lat, data.lng]).addTo(map);
        else marker.setLatLng([data.lat, data.lng]);
    });

    // --- Eventos inputs calle/altura ---
    async function actualizarDesdeTexto() {
        const prov = encodeURIComponent(provSelect.value);
        const depto = encodeURIComponent(deptoSelect.value);
        const loc = encodeURIComponent(locSelect.value);
        const calle = encodeURIComponent(calleInput.value.trim());
        const altura = encodeURIComponent(alturaInput.value.trim());

        if (!(prov && depto && loc && calle && altura)) return;

        const resp = await fetch(`${BACKEND_URL}/georef/coordenadas?provincia=${prov}&municipio=${depto}&localidad=${loc}&calle=${calle}&altura=${altura}`);
        const data = await resp.json();

        if (!data || !data.lat || !data.lng) return;

        map.setView([data.lat, data.lng], 15);
        if (!marker) marker = L.marker([data.lat, data.lng]).addTo(map);
        else marker.setLatLng([data.lat, data.lng]);

        latInput.value = data.lat;
        lngInput.value = data.lng;

        if (data.calle) calleInput.value = data.calle;
    }

    calleInput.addEventListener("change", actualizarDesdeTexto);
    alturaInput.addEventListener("change", actualizarDesdeTexto);

    // --- Click en el mapa ---
    map.on("click", e => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        latInput.value = lat;
        lngInput.value = lng;

        if (!marker) marker = L.marker([lat, lng]).addTo(map);
        else marker.setLatLng([lat, lng]);
    });

    // --- Configurar submit del formulario ---
    actualizarPerfil();
});

async function cargarProvincias(select) {
    const r = await fetch(`${BACKEND_URL}/georef/provincias`);
    const data = await r.json();

    select.innerHTML = "<option value=''>Seleccione provincia</option>";
    data.forEach(p =>
        select.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`
    );
};

async function cargarDepartamentos(select, provincia, seleccionado = null) {
    select.disabled = true;
    select.innerHTML = "<option>Cargando...</option>";

    const r = await fetch(`${BACKEND_URL}/georef/departamentos?provincia=${encodeURIComponent(provincia)}`);
    const data = await r.json();

    // Si el backend devolvió un error, evitar romper la app
    if (!Array.isArray(data)) {
        console.error("Error al cargar departamentos", data);
        select.innerHTML = "<option>Error al cargar</option>";
        return;
    }

    select.innerHTML = "<option value=''>Seleccione departamento</option>";
    data.forEach(d =>
        select.innerHTML += `<option value="${d.nombre}">${d.nombre}</option>`
    );

    if (seleccionado) select.value = seleccionado;
    select.disabled = false;
};

async function cargarLocalidades(select, provincia, depto, seleccionado = null) {
    select.disabled = true;
    select.innerHTML = "<option>Cargando...</option>";

    const r = await fetch(
        `${BACKEND_URL}/georef/localidades?provincia=${encodeURIComponent(provincia)}&municipio=${encodeURIComponent(depto)}`
    );
    const data = await r.json();

    // Si el backend devolvió un error, evitar romper la app
    if (!Array.isArray(data)) {
        console.error("Error al cargar localidades", data);
        select.innerHTML = "<option>Error al cargar</option>";
        return;
    }

    select.innerHTML = "<option value=''>Seleccione localidad</option>";
    data.forEach(l =>
        select.innerHTML += `<option value="${l.nombre}">${l.nombre}</option>`
    );

    if (seleccionado) select.value = seleccionado;
    select.disabled = false;
};

async function cargarDomicilioDesdeBackend(prov, depto, loc, calle, alt, usuario) {
    await cargarProvincias(prov);
    prov.value = usuario.provincia;

    await cargarDepartamentos(depto, usuario.provincia, usuario.departamento);

    await cargarLocalidades(
        loc,
        usuario.provincia,
        usuario.departamento,
        usuario.localidad
    );

    calle.value = usuario.calle || "";
    alt.value = usuario.altura || "";

    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    if (usuario.lat && usuario.lng) {
        latInput.value = usuario.lat;
        lngInput.value = usuario.lng;
    }
};

function cargarDatosUsuario() {
    // Cargar turnos desde sessionStorage
    const usuario = sessionStorage.getItem("usuario");

    if (!usuario) return;

    try {
        const usuarioAPI = JSON.parse(usuario);
        datosUsuario = adaptarUsuario(usuarioAPI);
    } catch (e) {
        console.error("Usuario inválido en storage", e);
    }

    const campos = {
        nombre: datosUsuario.nombre,
        apellido: datosUsuario.apellido,
        dni: datosUsuario.dni,
        telefono: datosUsuario.telefono?.[1],
        email: datosUsuario.email,
        clave: ""
    };

    Object.keys(campos).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = campos[id] || "";
    });
}

function adaptarUsuario(apiUsuario) {

    const direccion = apiUsuario.direcciones?.[0]

    return {
        id: apiUsuario.id,
        dni: apiUsuario.dni,
        apellido: apiUsuario.apellido,
        nombre: apiUsuario.nombre,
        email: apiUsuario.email,
        telefono: apiUsuario.telefonos?.[0] ?? [],
        direccion_id: direccion?.id || 0,
        calle: direccion.calle,
        altura: direccion.altura || "",
        localidad: direccion.localidad,
        departamento: direccion.departamento,
        provincia: direccion.provincia,
        pais: direccion.pais,
        lat: direccion.lat,
        lng: direccion.lng,
        aclaracion_de_direccion: direccion.aclaracion || ""
    };
}

/* GUARDAR PERFIL FINAL */
function actualizarPerfil() {
    const form = document.getElementById("formPerfilUsuario");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Tomar datos del formulario
        try {
            const nombre = document.getElementById("nombre").value.trim();
            const apellido = document.getElementById("apellido").value.trim();
            const dni = parseInt(document.getElementById("dni").value.trim());
            const email = document.getElementById("email").value.trim();
            const provincia = document.getElementById("provincia").value.trim();
            const departamento = document.getElementById("departamento").value.trim();
            const localidad = document.getElementById("localidad").value.trim();
            const calle = document.getElementById("calle").value.trim();
            const altura = document.getElementById("altura").value.trim();
            const lat = document.getElementById("lat").value;
            const lng = document.getElementById("lng").value;
            const aclaracion = document.getElementById("datos_adicionales").value.trim();
            const telefono = document.getElementById("telefono").value.trim();
            const password = document.getElementById("clave").value.trim();

            if (!lat || !lng) {
                crearModal("Error", "Debe seleccionar la ubicación en el mapa.", "error");
                return; // Detiene el envío
            };

            const direccionObj = {
                id: datosUsuario?.direccion_id,
                calle: calle,
                altura: altura,
                localidad: localidad,
                departamento: departamento,
                provincia: provincia,
                pais: "Argentina",
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                aclaracion: aclaracion,
            };

            let telefonosPayload = [];

            if (telefono && !isNaN(parseInt(telefono))) {
                if (datosUsuario.telefono.length) {
                    // Teléfono existente → enviar [id, numero]
                    telefonosPayload.push([datosUsuario.telefono[0], telefono]);
                } else {
                    telefonosPayload.push([0, telefono]);
                }
            } else {
                if (!datosUsuario.telefono.length) {
                    telefonosPayload = null
                }
            };

            let payload = {
                dni: dni,
                apellido: apellido,
                nombre: nombre,
                email: email,
                telefonos: telefonosPayload,
                direcciones: [direccionObj]
            };

            if (password && password.length > 0) {
                payload.password = password;
            };

            const respuesta = await fetch(`${BACKEND_URL}/users/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                crearModal("Error en la actualización", data.detail, "error");
                return;
            }

            sessionStorage.setItem("usuario", JSON.stringify({
                id: data.id,
                dni: data.dni,
                apellido: data.apellido,
                nombre: data.nombre,
                email: data.email,
                telefonos: data.telefonos,
                direcciones: data.direcciones
            }));

            alert("Perfil actualizado con éxito ✓");
            location.reload();

        } catch (error) {
            console.error("Error inesperado:", error);
            crearModal("Error inesperado", "Ocurrió un error inesperado en la actualización del perfil.", "error");
        }
    });
}

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