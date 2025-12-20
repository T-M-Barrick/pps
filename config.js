export const BACKEND_URL = "https://miturnoproduction.up.railway.app";

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

    // Tomar solo fecha, ignorando la zona
    console.log("fechaISO:", fechaISO, typeof fechaISO);
    const [year, month, day] = fechaISO.split("T")[0].split("-").map(Number);
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
};

export async function formatearHora(fechaISO) {
    if (!fechaISO) return "—";
    const partes = fechaISO.split("T");
    if (partes.length < 2) return "—";
    return partes[1].slice(0, 5); // HH:MM
};