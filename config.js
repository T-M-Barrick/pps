export const BACKEND_URL = "https://miturno-production.up.railway.app";

export async function manejarErrorRespuesta(resp, defaultMsg = "Error inesperado") {
    // Si el backend devolvió OK, no hay error
    if (resp.ok) return;

    let errorMsg = defaultMsg;

    try {
        const data = await resp.json();
        if (data && data.detail) {
            errorMsg = data.detail;
        }
    } catch (_) {
        // Si no se pudo leer JSON, dejamos defaultMsg
    }

    throw new Error(errorMsg);
}