import { BACKEND_URL } from "../../../config.js";

const empresaId = sessionStorage.getItem("empresa_activa_id");

if (!empresaId) {
    // No hay empresa seleccionada → redirigir
    window.location.href = "../../usuario/mis-empresas/mis-empresas.html";
}

let datosEmpresa = null

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    let marker = null;

    await cargarDatosEmpresa();

    // --- Cargar domicilio desde backend si existe ---
    if (datosEmpresa) {
        await cargarDomicilioDesdeBackend(provSelect, deptoSelect, locSelect, calleInput, alturaInput, datosEmpresa);

        // Opcional: centrar mapa en la dirección de la empresa
        if (datosEmpresa.lat && datosEmpresa.lng) {
            map.setView([datosEmpresa.lat, datosEmpresa.lng], 15);
            marker = L.marker([datosEmpresa.lat, datosEmpresa.lng]).addTo(map);
        }
    }

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

async function cargarDomicilioDesdeBackend(prov, depto, loc, calle, alt, empresa) {
    await cargarProvincias(prov);
    prov.value = empresa.provincia;

    await cargarDepartamentos(depto, empresa.provincia, empresa.departamento);

    await cargarLocalidades(
        loc,
        empresa.provincia,
        empresa.departamento,
        empresa.localidad
    );

    calle.value = empresa.calle || "";
    alt.value = empresa.altura || "";

    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    if (empresa.lat && empresa.lng) {
        latInput.value = empresa.lat;
        lngInput.value = empresa.lng;
    }
};

async function cargarDatosDesdeBackend() {
    try {
        const respuesta = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.error("No se pudieron obtener los datos de la empresa.");
            window.location.href = "../home-empresa/home-empresa.html";
            return;
        }

        const empresa = await respuesta.json();
        return empresa

    } catch (error) {
        console.error("Error al obtener datos:", error);
        window.location.href = "../home-empresa/home-empresa.html";
    }
};

async function cargarDatosEmpresa() {

    const data = await cargarDatosDesdeBackend();

    if (data) {
        datosEmpresa = adaptarEmpresa(data);
    }

    const campos = {
        nombre: datosEmpresa.nombre,
        cuit: datosEmpresa.cuit,
        rubro: datosEmpresa.rubro,
        rubro2: datosEmpresa.rubro2,
        email: datosEmpresa.email,
        telefono: datosEmpresa.telefono?.[1]
    };

    Object.keys(campos).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = campos[id] || "";
    });

    if (datosEmpresa.logo) {
        document.getElementById("logoPreview").src = datosEmpresa.logo;
    }
}

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
        telefono: emp.telefonos?.[0] ?? [],
        direccion_id: emp.direccion.id,
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

/* GUARDAR PERFIL FINAL */
function actualizarPerfil() {
    const form = document.getElementById("formPerfilEmpresa");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Tomar datos del formulario
        try {
            const nombre = document.getElementById("nombre").value.trim();
            const cuit = parseInt(document.getElementById("cuit").value.trim());
            const rubro = document.getElementById("rubro").value.trim();
            const rubro2 = document.getElementById("rubro2").value.trim();
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

            const direccionObj = {
                id: datosEmpresa?.direccion_id || 0,
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
                if (datosEmpresa.telefono.length) {
                    // Teléfono existente → enviar [id, numero]
                    telefonosPayload.push([datosEmpresa.telefono[0], telefono]);
                } else {
                    telefonosPayload.push([0, telefono]);
                }
            } else {
                if (!datosEmpresa.telefono.length) {
                    telefonosPayload = null
                }
            }

            const payload = {
                cuit: cuit,
                nombre: nombre,
                email: email,
                rubro: rubro,
                rubro2: rubro2,
                telefonos: telefonosPayload,
                direccion: direccionObj
            };

            if (logoModificado) {
                payload.logo = logoBase64; // puede ser string o null
            }

            const respuesta = await fetch(`${BACKEND_URL}/empresas/${empresaId}`, {
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

const inputLogo = document.getElementById("archivoLogo");
const btnCambiarLogo = document.getElementById("btnCambiarLogo");
const btnEliminarLogo = document.getElementById("btnEliminarLogo");
const imgPreview = document.getElementById("logoPreview");

let logoBase64 = null;
let logoModificado = false;

if (inputLogo && btnCambiarLogo && btnEliminarLogo && imgPreview) {

    // Abrir selector de archivos
    btnCambiarLogo.addEventListener("click", () => inputLogo.click());

    btnEliminarLogo.addEventListener("click", () => {
        imgPreview.src = "../../img/icono-perfil.png";
        logoBase64 = null;
        logoModificado = true;
    });


    // Al seleccionar archivo
    inputLogo.addEventListener("change", () => {
        const file = inputLogo.files[0];
        if (!file) return;

        /* ======================
           VALIDACIONES
        ====================== */

        // 1️⃣ Solo PNG
        if (file.type !== "image/png") {
            alert("Solo se permiten imágenes PNG.");
            inputLogo.value = "";
            return;
        }

        // 2️⃣ Máximo 10 KB
        const maxSize = 10 * 1024; // 10 KB
        if (file.size > maxSize) {
            alert("La imagen no puede superar los 10 KB.");
            inputLogo.value = "";
            return;
        }

        /* ======================
           BASE64 + PREVIEW
        ====================== */

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            // Preview
            imgPreview.src = dataUrl;

            // Guardar BASE64 PURO (sin data:image/png;base64,)
            logoBase64 = dataUrl.split(",")[1];

            logoModificado = true;
        };

        reader.readAsDataURL(file);
    });
}
