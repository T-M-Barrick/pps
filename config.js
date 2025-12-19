export const BACKEND_URL = "https://miturno.up.railway.app";

export async function manejarErrorRespuesta(resp, defaultMsg = "Error inesperado") {
    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
        let errorMsg = defaultMsg;
        if (data && data.detail) errorMsg = data.detail;
        throw new Error(errorMsg);
    }

    return data; // <-- devuelve JSON
}

export function formatearFecha(fechaISO) {
    if (!fechaISO) return "—";

    const fecha = new Date(fechaISO);

    if (isNaN(fecha)) return "—";

    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();

    return `${dia}/${mes}/${año}`;
}
