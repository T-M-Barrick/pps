import { BACKEND_URL } from "../config.js";

/* ============================================================
   =============== EFECTO TYPEWRITER DEL TÍTULO ================
=============================================================== */

(function () {
    const span = document.querySelector('#titulo span');
    if (!span) return;

    const originalText = span.textContent.trim();

    function typeText(el, text, delay = 100) {
        el.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            el.textContent += text.charAt(i);
            i++;
            if (i >= text.length) clearInterval(timer);
        }, delay);
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            typeText(span, originalText, 120);
        }, 250);
    });
})();

/* ============================================================
   ================= NAVIGACIÓN DEL LOGIN ======================
=============================================================== */

export function olvidoClave(event) {
    event.preventDefault();
    window.location.href = './pages/usuario/restablecer-password/forgot-password.html';
}

export function crearCuenta() {
    window.location.href = './pages/usuario/registro-usuario/registro-usuario.html';
}

export function entrarConGoogle() {
    console.log("Entrar con Google");
}

/* ============================================================
   ===================== LOGIN REAL ============================
=============================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("#form-login");

    if (!form) {
        console.error("No se encontró el formulario #form-login");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;
        const botonLogin = document.getElementById("btn-login");

        // feedback visual
        botonLogin.textContent = "Iniciando...";
        botonLogin.disabled = true;

        try {
            const resp = await fetch(`${BACKEND_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            if (!resp.ok) {
                const data = await resp.json();
                alert(data.detail || "Credenciales incorrectas");

                // restaurar botón
                botonLogin.textContent = "Iniciar Sesión";
                botonLogin.disabled = false;
                return;
            }

            // login OK → redirigir
            window.location.href = "./pages/usuario/home-usuario/home-usuario.html";

        } catch (err) {
            console.error(err);
            alert("Error de conexión con el servidor");
        }
    });

});

/* ============================================================
   ========== EVENTOS PARA BOTONES DEL INDEX ===================
=============================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const btnCrear = document.querySelector("#btn-crear");
    const btnGoogle = document.querySelector("#btn-google");
    const linkOlvide = document.querySelector("#olvide");

    if (btnCrear) btnCrear.addEventListener("click", crearCuenta);

    if (btnGoogle) btnGoogle.addEventListener("click", entrarConGoogle);

    if (linkOlvide) {
        linkOlvide.addEventListener("click", (e) => {
            e.preventDefault();
            olvidoClave(e);
        });
    }

});
