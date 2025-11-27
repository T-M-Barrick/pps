import { BACKEND_URL } from "../../../config.js";

// ===================== ESTILOS DEL MODAL =====================
const estiloModal = document.createElement('style');
estiloModal.innerHTML = `
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-overlay.mostrar {
    display: flex;
}

.modal-card {
    background: white;
    padding: 2rem;
    border-radius: 20px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    animation: fadeIn 0.25s ease;
}

#modal-btn { 
    margin-top: 1.5rem;
    background: #AC0505; 
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    font-size: 16px;
    cursor: pointer;
    transition: 0.2s;
}

#modal-btn:hover {
    background: #AC0505; 
    transform: translateY(-2px);
}

@keyframes fadeIn {
    from { transform: scale(0.9); opacity: 0; }
    to  { transform: scale(1); opacity: 1; }
}
`;
document.head.appendChild(estiloModal);

// ===============================================================
// ================== FUNCIÓN PRINCIPAL ==========================
// ===============================================================
async function resetearClave(event) {
    event.preventDefault();

    const nuevaClave = document.getElementById('nueva-clave').value;
    const confirmacionClave = document.getElementById('confirmacion-clave').value;

    // Validaciones front
    if (nuevaClave.length < 6) {
        mostrarModal("❌ Error:<br>La contraseña debe tener al menos 6 caracteres.", "Aceptar");
        return;
    }

    if (nuevaClave !== confirmacionClave) {
        mostrarModal("❌ Error:<br>Las contraseñas no coinciden.", "Aceptar");
        return;
    }

    // === OBTENER TOKEN DE LA URL ===
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        mostrarModal("❌ Error:<br>Token inválido o faltante.", "Aceptar");
        return;
    }

    // === ENVIAR AL BACKEND ===
    try {
        const resp = await fetch(`${BACKEND_URL}/users/forgot_password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                new_password: nuevaClave
            })
        });

        const data = await resp.json();

        if (!resp.ok) {
            mostrarModal("❌ Error:<br>" + (data.detail || "No se pudo restablecer la contraseña."), "Aceptar");
            return;
        }

        // ÉXITO
        mostrarModal(
            "✅ Éxito:<br>Tu contraseña fue restablecida correctamente.",
            "Ir a Iniciar Sesión",
            "../../../index.html"
        );

    } catch (err) {
        mostrarModal("❌ Error inesperado:<br>No se pudo conectar con el servidor.", "Aceptar");
    }
}

// ===============================================================
// ====================== MODAL REUTILIZABLE ======================
// ===============================================================
function mostrarModal(mensajeHTML, textoBoton, urlDestino) {
    const overlay = document.getElementById('modal-overlay');
    const mensajeElemento = document.getElementById('modal-mensaje'); 
    const boton = document.getElementById('modal-btn'); 

    mensajeElemento.innerHTML = mensajeHTML; 
    boton.textContent = textoBoton;

    overlay.classList.add('mostrar');
    boton.onclick = () => {
        overlay.classList.remove('mostrar');
        if (urlDestino) window.location.href = urlDestino;
    };
}
