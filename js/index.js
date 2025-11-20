import {BACKEND_URL} from "../config.js";

// Esperamos a que TODO el HTML esté cargado
// así podemos buscar elementos dentro del DOM.
document.addEventListener("DOMContentLoaded", () => {

    // Obtenemos el formulario completo por su id
    const form = document.querySelector("#form-login");

    // Capturamos CUANDO EL USUARIO HACE SUBMIT
    // (click en el botón o enter en los inputs)
    form.addEventListener("submit", async (e) => {

        // Evita que el formulario recargue la página automáticamente
        e.preventDefault();

        // Leemos los valores del email y la contraseña
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;

        try {

            // Hacemos un POST al endpoint de LOGIN del backend
            const resp = await fetch(`${BACKEND_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                
                // MUY IMPORTANTE:
                // Habilita que el backend pueda enviar una cookie HttpOnly
                credentials: "include",

                // Enviamos email y password como JSON
                body: JSON.stringify({ email, password })
            });

            // Si la respuesta NO es 200 → error de login
            if (!resp.ok) {
                const data = await resp.json();
                alert(data.detail || "Credenciales incorrectas");
                return;
            }

            // SI TODO SALIÓ BIEN →
            // el backend envió la cookie con el token
            // entonces redirigimos al home en la nube
            window.location.href = "/home-usuario/home-usuario.html";

        } catch (err) {

            // Si hubo fallo de red o no se pudo conectar
            console.error(err);
            alert("Error de conexión con el servidor");
        }
    });

});

// en el html <script type="module" src="js/index.js"></script>
