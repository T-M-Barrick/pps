import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

window.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) return; // No hay token → no hacemos nada

    try {
        const data = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/empresas/aceptar_rol`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            }),
            "No se pudo procesar la invitación"
        );

        mostrarModal("✅ " + data.message);

    } catch (err) {
        mostrarModal("❌ " + err.message);
    }
});

// ---------------- MODAL ----------------
function mostrarModal(mensaje) {
    const overlay = document.getElementById('modal-overlay');
    const mensajeElemento = document.getElementById('modal-mensaje');
    const boton = document.getElementById('modal-btn');

    mensajeElemento.innerHTML = mensaje;
    overlay.classList.add('mostrar');

    boton.onclick = () => {
        overlay.classList.remove('mostrar');
    };
}
