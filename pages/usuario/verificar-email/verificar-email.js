// verificar-email.js
import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

window.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        mostrarModalSimple("❌", "Token inválido o faltante");
        return;
    }

    try {
        const data = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/users/verificacion_email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            }),
            "Error al verificar email"
        );

        mostrarModalSimple("✅", data.message, () => {
            window.location.href = "../home-usuario/home-usuario.html";
        });

    } catch (err) {
        mostrarModalSimple("❌", err.message);
    }
});

// modal-simple.js
function mostrarModalSimple(titulo, mensaje, callback = null) {
    // Crear overlay
    const overlay = document.createElement("div");
    overlay.style = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Crear caja del modal
    const modalBox = document.createElement("div");
    modalBox.style = `
        background: white;
        padding: 20px 30px;
        border-radius: 10px;
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;

    modalBox.innerHTML = `
        <h2>${titulo}</h2>
        <p>${mensaje}</p>
        <button id="modal-cerrar">Aceptar</button>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    // Función para cerrar
    const cerrar = () => {
        overlay.remove();
        if (callback) callback();
    };

    document.getElementById("modal-cerrar").onclick = cerrar;
    overlay.addEventListener("click", e => {
        if (e.target === overlay) cerrar();
    });
}
