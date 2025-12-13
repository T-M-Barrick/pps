import { BACKEND_URL, manejarErrorRespuesta } from "../../../config.js";

// === Estilos del modal ===
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
    font-size: 20px;
    cursor: pointer;
    transition: 0.2s;
}

#modal-btn:hover {
    background: #8a0404;
    transform: translateY(-2px);
}

@keyframes fadeIn {
    from { transform: scale(0.9); opacity: 0; }
    to  { transform: scale(1); opacity: 1; }
}
`;
document.head.appendChild(estiloModal);

// =========================
//       MANEJAR FORM
// =========================
async function restablecerClave(event) {
    event.preventDefault();

    const emailInput = document.getElementById('resetEmail');
    const email = emailInput.value.trim();

    if (!email) {
        mostrarModalError("Por favor, ingresa tu email.");
        return;
    }

    try {
        const data = await manejarErrorRespuesta(
            await fetch(`${BACKEND_URL}/users/forgot_password_email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            }),
            "Hubo un problema al enviar el correo"
        );

        mostrarModalExito(data.message);
        emailInput.value = "";

    } catch (err) {
        mostrarModalError(err.message || "Error de conexión con el servidor");
    }
}

window.restablecerClave = restablecerClave;


// =========================
//         MODALES
// =========================

function mostrarModalExito(mensaje) {
    const overlay = document.getElementById('modal-overlay');
    const mensajeElemento = document.getElementById('modal-mensaje');
    const boton = document.getElementById('modal-btn');

    mensajeElemento.textContent = mensaje;
    overlay.classList.add('mostrar');

    const cerrar = () => {
        overlay.classList.remove('mostrar');
        boton.removeEventListener('click', cerrar);
    };

    boton.textContent = "Aceptar";
    boton.addEventListener('click', cerrar);
}

function mostrarModalError(mensaje) {
    const overlay = document.getElementById('modal-overlay');
    const mensajeElemento = document.getElementById('modal-mensaje');
    const boton = document.getElementById('modal-btn');

    mensajeElemento.innerHTML = "❌ Error:<br>" + mensaje;

    overlay.classList.add('mostrar');

    const cerrar = () => {
        overlay.classList.remove('mostrar');
        boton.removeEventListener('click', cerrar);
    };

    boton.textContent = "Aceptar";
    boton.addEventListener('click', cerrar);
}
