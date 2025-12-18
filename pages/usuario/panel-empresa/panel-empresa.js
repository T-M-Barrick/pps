import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

const params = new URLSearchParams(window.location.search);
const empresaId = Number(params.get("id"));

// Obtener empresas desde sessionStorage
const empresasStorage = JSON.parse(sessionStorage.getItem("empresas")) || [];

// Buscar la empresa por id
const empresaStorage = empresasStorage.find(e => e.id === empresaId) || null;

const empresa = adaptarEmpresa(empresaStorage)

if (!empresa) {
    console.warn("No se encontró la empresa en sessionStorage:", empresaId);
}

document.addEventListener("DOMContentLoaded", () => {

    if (empresa) {
        document.getElementById("empresaNombre").textContent = empresa.nombre || "";
        document.getElementById("empresaRubro").textContent = empresa.rubro2 ? `${empresa.rubro} - ${empresa.rubro2}` : empresa.rubro || "";
        document.getElementById("empresaDireccion").textContent = armarDomicilio(empresa) || "";
        document.getElementById("empresaAclaracionDireccion").textContent = empresa.aclaracion_de_direccion || "—";
        document.getElementById("empresaTelefono").textContent = empresa.telefonos?.[0]?.[1] || "—";
        document.getElementById("empresaEmail").textContent = empresa.email || "—";
        document.getElementById("empresaLogo").src = empresa.logo || "../../img/icono-perfil.png";
        const linkMapsEl = document.getElementById("empresaLinkMaps");
        const calificacionEl = document.getElementById("empresaCalificacion");
        const btnReservar = document.getElementById("btnReservar");

        if (empresa.direccion?.lat && empresa.direccion?.lng) {
            linkMapsEl.style.display = "inline"; // aparece junto a la dirección
            linkMapsEl.onclick = () => mostrarUbicacion(empresa.lat, empresa.lng);
        } else {
            linkMapsEl.style.display = "none"; // ocultar si no hay coordenadas
        }

        if (calificacionEl) {
            if (empresa.calificacion !== undefined && empresa.calificacion !== null) {
                const calificacion = empresa.calificacion;

                const estrellasLlenas = Math.floor(calificacion);
                const mediaEstrella = calificacion % 1 >= 0.5 ? 1 : 0;
                const estrellasVacias = 5 - estrellasLlenas - mediaEstrella;

                let html = "";
                html += "⭐".repeat(estrellasLlenas);
                html += mediaEstrella ? "✩" : "";
                html += "☆".repeat(estrellasVacias);

                calificacionEl.innerHTML = `${html} <span class="calificacion-num">(${calificacion})</span>`;
            } else {
                calificacionEl.textContent = "—";
            }
        }

        if (btnReservar) {
            btnReservar.onclick = () => {
                window.location.href =
                    `../reservar-turno/reservar-turno.html?id=${empresaId}`;
            };
        }

        // FAVORITOS
        let favoritos = JSON.parse(sessionStorage.getItem("favoritos")) || [];

        function estaEnFavoritos(id) {
            return favoritos.some(f => f.id === id);
        }

        function actualizarBotonFavorito() {
            const btn = document.getElementById("btnFavorito");
            if (!btn || !empresa) return;

            if (estaEnFavoritos(empresa.id)) {
                btn.textContent = "★ Quitar de favoritos";
                btn.classList.add("remover");
            } else {
                btn.textContent = "★ Agregar a favoritos";
                btn.classList.remove("remover");
            }
        }

        // Inicializar estado del botón de favoritos
        actualizarBotonFavorito();

        const btnFavorito = document.getElementById("btnFavorito");
        if (btnFavorito) {
            btnFavorito.onclick = async () => {

                let nuevosFavoritos;

                if (estaEnFavoritos(empresa.id)) {
                    // quitar
                    nuevosFavoritos = favoritos.filter(f => f.id !== empresa.id);
                } else {
                    // agregar
                    nuevosFavoritos = [...favoritos, empresaStorage];
                }

                try {
                    const res = await manejarErrorRespuesta(
                        await fetch(`${BACKEND_URL}/users/me`, {
                            method: "PUT",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                favoritos: nuevosFavoritos.map(f => f.id)  // se envían solo IDs
                            })
                        }),
                        "No se pudo actualizar favoritos"
                    );

                    // Guardar en sessionStorage
                    favoritos = nuevosFavoritos;
                    sessionStorage.setItem("favoritos", JSON.stringify(favoritos));

                    // Actualizar botón
                    actualizarBotonFavorito();

                    alert(estaEnFavoritos(empresa.id)
                        ? "Empresa agregada a favoritos"
                        : "Empresa quitada de favoritos"
                    );

                } catch (err) {
                    console.error(err);
                }
            };
        }
    }
});

// ========================================
//     MOSTRAR UBICACIÓN
// ========================================
function mostrarUbicacion(lat, lng) {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
}

function armarDomicilio(apiObj) {
    if (!apiObj) return "";

    const partes = [];

    // Calle + altura
    if (apiObj.calle) {
        let calle = apiObj.calle;

        if (apiObj.altura) {
            calle += ` ${apiObj.altura}`;
        }

        partes.push(calle);
    }

    // Localidad
    if (apiObj.localidad) {
        partes.push(apiObj.localidad);
    }

    // Municipio / departamento
    if (apiObj.municipio) {
        partes.push(apiObj.municipio);
    }

    return partes.join(", ");
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
        calle: emp.direccion.calle,
        altura: emp.direccion.altura || "",
        localidad: emp.direccion.localidad,
        departamento: emp.direccion.departamento,
        provincia: emp.direccion.provincia,
        pais: emp.direccion.pais,
        lat: emp.direccion.lat,
        lng: emp.direccion.lng,
        aclaracion_de_direccion: emp.direccion.aclaracion || "",
        calificacion: emp.calificacion,
        telefonos: emp.telefonos
    };
}