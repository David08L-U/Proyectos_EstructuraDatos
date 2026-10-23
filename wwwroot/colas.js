// ============================================================
//  colas.js – Lógica de la interfaz de los ejercicios de Colas
// ============================================================

// =====================================================================
//  EJERCICIO 3: ESTACIONAMIENTO PARA AUTOS
// =====================================================================

const TARIFA = 2.00;          // $ por segundo (la API manda la tarifa real)
let autosActuales = [];       // copia local para actualizar el tiempo cada segundo

// ---------- Utilidades de formato ----------
const formatoMoneda = n => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoHora = f => new Date(f).toLocaleTimeString("es-MX", { hour12: false });

function formatoTiempo(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return (h > 0 ? h + "h " : "") + (h > 0 || m > 0 ? m + "m " : "") + s + "s";
}

function segundosDesde(fecha) {
    return Math.max(1, Math.ceil((Date.now() - new Date(fecha).getTime()) / 1000));
}

// ---------- Submenú: 1. Entrada / 2. Salida ----------
document.querySelectorAll("#ej3 .opcion").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#ej3 .opcion").forEach(b => b.classList.remove("activa"));
        document.querySelectorAll("#pnlEntrada, #pnlSalida").forEach(p => p.classList.remove("visible"));
        btn.classList.add("activa");
        document.getElementById(btn.dataset.panel).classList.add("visible");
    });
});

// ---------- Validación en el navegador (la API también valida) ----------
function validarEntrada(placas, propietario) {
    if (placas === "" || propietario === "")
        return "Hay datos faltantes: captura las placas y el propietario.";
    if (!/^[A-Z0-9-]{5,10}$/.test(placas))
        return "Placas no válidas: usa de 5 a 10 caracteres (letras, números o guion).";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{3,60}$/.test(propietario))
        return "Propietario no válido: introduce sólo letras (mínimo 3).";
    return null;
}

// ---------- 1. Entrada de Auto ----------
document.getElementById("frmEntradaAuto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtPlacas = document.getElementById("txtPlacas");
    const txtPropietario = document.getElementById("txtPropietario");

    const placas = txtPlacas.value.trim().toUpperCase();
    const propietario = txtPropietario.value.trim();

    const error = validarEntrada(placas, propietario);
    if (error) {
        mostrarMensaje("lblMensajeEntrada", error, "error");
        return;
    }

    try {
        const r = await api("/api/colas/estacionamiento/entrada", "POST", { placas, propietario });
        mostrarMensaje("lblMensajeEntrada", "✔ " + r.mensaje, "ok");
        txtPlacas.value = "";
        txtPropietario.value = "";
        txtPlacas.focus();
        await cargarEstacionamiento();
    } catch (err) {
        mostrarMensaje("lblMensajeEntrada", err.message, "error");
    }
});

document.getElementById("frmEntradaAuto").addEventListener("reset", () => {
    mostrarMensaje("lblMensajeEntrada", "", "info");
});

// Las placas se escriben en mayúsculas automáticamente
document.getElementById("txtPlacas").addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase();
});

// ---------- 2. Salida de Autos ----------
document.getElementById("btnRegistrarSalida").addEventListener("click", async () => {
    const divTicket = document.getElementById("divTicket");
    try {
        const t = await api("/api/colas/estacionamiento/salida", "POST");

        document.getElementById("lblTicketPlacas").textContent = t.placas;
        document.getElementById("lblTicketPropietario").textContent = t.propietario;
        document.getElementById("lblTicketEntrada").textContent = formatoHora(t.horaEntrada);
        document.getElementById("lblTicketSalida").textContent = formatoHora(t.horaSalida);
        document.getElementById("lblTicketTiempo").textContent =
            `${formatoTiempo(t.segundos)} (${t.segundos} s × ${formatoMoneda(t.tarifa)})`;
        document.getElementById("lblTicketCosto").textContent = formatoMoneda(t.costo);
        divTicket.classList.remove("oculto");

        mostrarMensaje("lblMensajeSalida", `✔ Salió el auto ${t.placas}.`, "ok");
        await cargarEstacionamiento();
    } catch (err) {
        divTicket.classList.add("oculto");
        mostrarMensaje("lblMensajeSalida", err.message, "error");
    }
});

// ---------- Mostrar la estructura ----------
async function cargarEstacionamiento() {
    try {
        const d = await api("/api/colas/estacionamiento");
        autosActuales = d.autos;

        document.getElementById("lblTotalAutos").textContent = d.total;
        document.getElementById("lblFrente").textContent = d.frente ? d.frente.placas : "—";
        document.getElementById("lblFinal").textContent = d.final ? d.final.placas : "—";

        dibujarColaVisual(d.autos);
        dibujarTabla();
    } catch (err) {
        mostrarMensaje("lblMensajeEntrada", "No se pudo cargar el estacionamiento: " + err.message, "error");
    }
}

// Dibuja los nodos: [FRENTE] ⇄ [auto] ⇄ [FINAL] ↺
function dibujarColaVisual(autos) {
    const div = document.getElementById("divColaVisual");
    div.innerHTML = "";

    if (autos.length === 0) {
        div.innerHTML = `<p class="texto-suave">El estacionamiento está vacío.</p>`;
        return;
    }

    autos.forEach((a, i) => {
        if (i > 0) div.insertAdjacentHTML("beforeend", `<span class="enlace" title="Siguiente / Anterior">⇄</span>`);

        let etiqueta = "";
        if (i === 0) etiqueta += `<span class="tag tag-frente">FRENTE</span>`;
        if (i === autos.length - 1) etiqueta += `<span class="tag tag-final">FINAL</span>`;

        div.insertAdjacentHTML("beforeend", `
            <div class="nodo">
                <div class="nodo-tags">${etiqueta}</div>
                <img src="img/auto.svg" alt="Auto" class="nodo-img">
                <strong>${a.placas}</strong>
                <small>${a.propietario}</small>
            </div>`);
    });

    // Flecha que indica que el final apunta de regreso al frente (circular)
    div.insertAdjacentHTML("beforeend",
        `<span class="enlace circular" title="El final apunta al frente y el frente al final">↺ al frente</span>`);
}

// Tabla con tiempo y costo que avanzan en vivo
function dibujarTabla() {
    const tbd = document.getElementById("tbdAutos");
    if (autosActuales.length === 0) {
        tbd.innerHTML = `<tr><td colspan="6" class="texto-suave">No hay autos dentro.</td></tr>`;
        return;
    }
    tbd.innerHTML = autosActuales.map((a, i) => {
        const seg = segundosDesde(a.horaEntrada);
        return `<tr>
            <td>${i + 1}</td>
            <td><strong>${a.placas}</strong></td>
            <td>${a.propietario}</td>
            <td>${formatoHora(a.horaEntrada)}</td>
            <td>${formatoTiempo(seg)}</td>
            <td>${formatoMoneda(seg * TARIFA)}</td>
        </tr>`;
    }).join("");
}

// Actualiza tiempo y costo cada segundo
setInterval(dibujarTabla, 1000);

// Carga inicial
cargarEstacionamiento();
