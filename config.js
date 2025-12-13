export const BACKEND_URL = "https://miturno-production.up.railway.app";

export async function manejarErrorRespuesta(resp, defaultMsg = "Error inesperado") {
    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
        let errorMsg = defaultMsg;
        if (data && data.detail) errorMsg = data.detail;
        throw new Error(errorMsg);
    }

    return data; // <-- devuelve JSON
}
