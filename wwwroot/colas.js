// ============================================================
//  colas.js – Lógica de la interfaz de los ejercicios de Colas
// ============================================================

// =====================================================================
//  EJERCICIO 2: JUEGO PINTAR COCHES (Víctor)
// =====================================================================

const PALETA_COLORES = [
    { nombre: "Amarillo", hex: "#EAB308", texto: "#000" },
    { nombre: "Crema", hex: "#FEF08A", texto: "#000" },
    { nombre: "Verde oliva", hex: "#65A30D", texto: "#fff" },
    { nombre: "Naranja", hex: "#F97316", texto: "#fff" },
    { nombre: "Azul oscuro", hex: "#1E3A8A", texto: "#fff" },
    { nombre: "Verde", hex: "#16A34A", texto: "#fff" },
    { nombre: "Rojo", hex: "#DC2626", texto: "#fff" },
    { nombre: "Guinda", hex: "#881337", texto: "#fff" },
    { nombre: "Café", hex: "#78350F", texto: "#fff" }
];

let estadoJuego = null;
let timerJuego = null;
let timerCronometro = null;
let segundosProximo = 20;
let tiempoSegundos = 0;
let ultimoAtendido = null;

function renderPaleta() {
    const div = document.getElementById("divPaletaColores");
    if (!div) return;
    div.innerHTML = PALETA_COLORES.map(c => `
        <button type="button" class="btn-color-paleta" data-color="${c.nombre}"
            style="background:${c.hex}; color:${c.texto};">
            <span class="muestra-color" style="background:${c.hex}; border:2px solid ${c.texto === '#000' ? '#cbd5e1' : '#fff'};"></span>
            <strong>${c.nombre}</strong>
        </button>`).join("");

    div.querySelectorAll(".btn-color-paleta").forEach(btn => {
        btn.addEventListener("click", () => {
            pintarCarroFrente(btn.dataset.color);
        });
    });
}

function pintarTablero(estado) {
    estadoJuego = estado;

    document.getElementById("lblJuegoPintados").textContent = estado.carrosPintados;
    document.getElementById("lblJuegoColaCount").textContent = `${estado.total} / ${estado.capacidad}`;
    document.getElementById("lblJuegoVelocidad").textContent = `Cada ${estado.intervaloLlegada}s`;

    const lblColaEstado = document.getElementById("lblJuegoColaEstado");
    if (estado.total >= 4) {
        lblColaEstado.textContent = "¡PELIGRO DE SATURACIÓN!";
        lblColaEstado.style.color = "#dc2626";
    } else {
        lblColaEstado.textContent = "cola de atención";
        lblColaEstado.style.color = "";
    }

    // Dibujar la cola de coches
    const divCola = document.getElementById("divColaCochesVisual");
    if (estado.carros.length === 0) {
        divCola.innerHTML = `<div class="pista-vacia">La cola está vacía. Enfilando el próximo carro...</div>`;
    } else {
        divCola.innerHTML = estado.carros.map((carro, idx) => {
            const esFrente = idx === 0;
            const esFinal = idx === estado.carros.length - 1;
            return `
                <div class="coche-tarjeta ${esFrente ? 'coche-frente' : ''}">
                    <div class="coche-header">
                        ${esFrente ? '<span class="tag tag-frente">👉 FRENTE (Atendiendo)</span>' : `<span class="tag">#${idx + 1}</span>`}
                        ${esFinal && !esFrente ? '<span class="tag tag-final">FINAL</span>' : ''}
                    </div>
                    <div class="coche-grafico">
                        <img src="img/auto.svg" alt="Carro #${carro.id}" class="coche-svg">
                    </div>
                    <div class="etiqueta-color-pedida" style="border-left: 6px solid ${carro.colorHex};">
                        <small>Color pedido:</small>
                        <strong>${carro.colorObjetivo}</strong>
                    </div>
                </div>`;
        }).join("");
    }

    // Actualizar coche atendido
    const slotAtendido = document.getElementById("cocheAtendidoVisual");
    if (ultimoAtendido) {
        slotAtendido.className = "coche-tarjeta atendido-exito";
        slotAtendido.innerHTML = `
            <img src="img/auto.svg" alt="Carro atendido" class="coche-svg anim-pintado">
            <span class="etiqueta-color" style="background:${ultimoAtendido.colorHex}; color:#fff; font-weight:700;">
                ✔ ${ultimoAtendido.colorObjetivo}
            </span>`;
    }

    // Si el juego ha terminado
    if (estado.juegoTerminado) {
        finalizarJuegoPartida(estado);
    }

    // Actualizar tabla de récords
    if (estado.records) {
        pintarRecords(estado.records);
    }
}

function pintarRecords(records) {
    const tbd = document.getElementById("tbdRecordsJuego");
    if (!tbd) return;
    if (records.length === 0) {
        tbd.innerHTML = `<tr><td colspan="5" class="texto-suave">Aún no hay récords guardados. ¡Sé el primero!</td></tr>`;
        return;
    }
    tbd.innerHTML = records.map((r, i) => `
        <tr>
            <td><strong>#${i + 1}</strong></td>
            <td><strong>${seguro(r.jugador)}</strong></td>
            <td><span class="tag" style="background:#dcfce7; color:#166534; font-weight:800; font-size:1rem;">${r.carrosPintados}</span></td>
            <td>${r.tiempoTotalSegundos} s</td>
            <td>${new Date(r.fecha).toLocaleDateString("es-MX")} ${new Date(r.fecha).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>`).join("");
}

async function cargarEstadoJuego() {
    try {
        const est = await api("/api/colas/juego/estado");
        pintarTablero(est);
    } catch (err) {
        mostrarMensaje("lblMensajeJuego", err.message, "error");
    }
}

async function iniciarNuevaPartida() {
    try {
        detenerTemporizadores();
        ultimoAtendido = null;
        tiempoSegundos = 0;
        document.getElementById("lblJuegoTiempo").textContent = "00:00";
        document.getElementById("divFinJuegoModal").classList.add("oculto");

        const r = await api("/api/colas/juego/iniciar", "POST");
        mostrarMensaje("lblMensajeJuego", "✔ " + r.mensaje, "ok");
        pintarTablero(r.estado);

        // Iniciar cronómetro de tiempo jugado
        timerCronometro = setInterval(() => {
            tiempoSegundos++;
            const m = String(Math.floor(tiempoSegundos / 60)).padStart(2, "0");
            const s = String(tiempoSegundos % 60).padStart(2, "0");
            document.getElementById("lblJuegoTiempo").textContent = `${m}:${s}`;
        }, 1000);

        // Iniciar ciclo de enfilamiento
        iniciarCicloEnfilar(r.estado.intervaloLlegada);
    } catch (err) {
        mostrarMensaje("lblMensajeJuego", err.message, "error");
    }
}

function iniciarCicloEnfilar(intervaloSeg) {
    if (timerJuego) clearInterval(timerJuego);
    segundosProximo = intervaloSeg;
    actualizarBarraEnfilar(segundosProximo, intervaloSeg);

    timerJuego = setInterval(async () => {
        segundosProximo--;
        actualizarBarraEnfilar(segundosProximo, estadoJuego ? estadoJuego.intervaloLlegada : 20);

        if (segundosProximo <= 0) {
            // Tiempo cumplido: llega un nuevo carro
            try {
                const r = await api("/api/colas/juego/enfilaSiguiente", "POST");
                pintarTablero(r.estado);
                if (r.finDelJuego) {
                    finalizarJuegoPartida(r.estado);
                } else {
                    segundosProximo = r.estado.intervaloLlegada;
                }
            } catch (err) {
                mostrarMensaje("lblMensajeJuego", err.message, "error");
            }
        }
    }, 1000);
}

function actualizarBarraEnfilar(restantes, total) {
    const lbl = document.getElementById("lblCuentaAtrasEnfilar");
    const bar = document.getElementById("barProgresoEnfilar");
    if (!lbl || !bar) return;
    lbl.textContent = `${Math.max(0, restantes)} s`;
    const pct = Math.min(100, Math.max(0, ((total - restantes) / total) * 100));
    bar.style.width = `${pct}%`;
}

async function pintarCarroFrente(colorElegido) {
    if (!estadoJuego || estadoJuego.juegoTerminado) {
        return mostrarMensaje("lblMensajeJuego", "Inicia una nueva partida para jugar.", "info");
    }
    if (estadoJuego.carros.length === 0) {
        return mostrarMensaje("lblMensajeJuego", "Espera a que llegue un carro a la cola.", "info");
    }

    try {
        const r = await api("/api/colas/juego/pintar", "POST", { color: colorElegido });
        ultimoAtendido = {
            id: r.atendido.id,
            colorObjetivo: r.atendido.colorObjetivo,
            colorHex: r.atendido.colorHex
        };
        mostrarMensaje("lblMensajeJuego", "✔ " + r.mensaje, "ok");
        pintarTablero(r.estado);

        // Si la velocidad cambió, reiniciar el ciclo con el nuevo intervalo
        if (r.estado.intervaloLlegada !== estadoJuego.intervaloLlegada) {
            iniciarCicloEnfilar(r.estado.intervaloLlegada);
        }
    } catch (err) {
        mostrarMensaje("lblMensajeJuego", "✖ " + err.message, "error");
    }
}

function finalizarJuegoPartida(estado) {
    detenerTemporizadores();
    mostrarMensaje("lblMensajeJuego", "🚨 ¡Juego terminado! La cola llegó a 5 carros.", "error");

    const modal = document.getElementById("divFinJuegoModal");
    if (modal) {
        document.getElementById("lblRecordCarros").textContent = estado.carrosPintados;
        document.getElementById("lblRecordTiempo").textContent = `${tiempoSegundos} s`;
        modal.classList.remove("oculto");
        modal.scrollIntoView({ behavior: "smooth" });
    }
}

function detenerTemporizadores() {
    if (timerJuego) { clearInterval(timerJuego); timerJuego = null; }
    if (timerCronometro) { clearInterval(timerCronometro); timerCronometro = null; }
}

document.getElementById("btnIniciarJuego").addEventListener("click", iniciarNuevaPartida);
document.getElementById("btnReintentar").addEventListener("click", iniciarNuevaPartida);

document.getElementById("frmGuardarRecord").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtJugador = document.getElementById("txtNombreJugador");
    const jugador = txtJugador.value.trim();

    try {
        const r = await api("/api/colas/juego/guardarRecord", "POST", { jugador });
        mostrarMensaje("lblMensajeRecord", "✔ " + r.mensaje, "ok");
        pintarRecords(r.records);
    } catch (err) {
        mostrarMensaje("lblMensajeRecord", err.message, "error");
    }
});

renderPaleta();
cargarEstadoJuego();

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
