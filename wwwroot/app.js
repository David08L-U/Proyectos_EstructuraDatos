// ============================================================
//  app.js – Funciones compartidas por todas las páginas
// ============================================================

// ---------- Llamar a la API (C#) ----------
// Ejemplo: const datos = await api("/api/listas/estado");
async function api(url, metodo = "GET", cuerpo = null) {
    const opciones = { method: metodo, headers: { "Content-Type": "application/json" } };
    if (cuerpo !== null) opciones.body = JSON.stringify(cuerpo);

    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        // El backend manda { mensaje: "..." } cuando algo sale mal
        throw new Error(datos.mensaje || "Ocurrió un error en el servidor.");
    }
    return datos;
}

// ---------- Mensajes al usuario ----------
// tipo: "ok" | "error" | "info"
function mostrarMensaje(idElemento, texto, tipo = "info") {
    const lbl = document.getElementById(idElemento);
    if (!lbl) return;
    lbl.textContent = texto;
    lbl.className = "mensaje mensaje-" + tipo;
}

// ---------- Pestañas de ejercicios ----------
// Muestra solo el ejercicio cuyo id coincide con el #hash de la URL
function activarPestanas() {
    function mostrar() {
        const id = (location.hash || "#ej1").substring(1);
        document.querySelectorAll(".ejercicio").forEach(sec => {
            sec.classList.toggle("visible", sec.id === id);
        });
        document.querySelectorAll(".pestanas a").forEach(tab => {
            tab.classList.toggle("activa", tab.getAttribute("href") === "#" + id);
        });
    }
    window.addEventListener("hashchange", mostrar);
    mostrar();
}

// ---------- Indicador de estado de la API (menú principal) ----------
async function verificarApi(idElemento) {
    const lbl = document.getElementById(idElemento);
    try {
        await api("/api/listas/estado");
        lbl.textContent = "● API conectada";
        lbl.classList.add("ok");
    } catch {
        lbl.textContent = "● API sin conexión";
        lbl.classList.add("error");
    }
}
