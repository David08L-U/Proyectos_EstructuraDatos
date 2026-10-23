// ============================================================
//  colas.js – Lógica de la interfaz de los ejercicios de Colas
// ============================================================

// =====================================================================
//  EJERCICIO 2: JUEGO PINTAR COCHES (Víctor)
// =====================================================================

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
let ultimoAtendido = { id: 0, colorObjetivo: "Amarillo", colorHex: "#EAB308" };
let sonidoActivo = true;

// Generador de SVG para carro con color dinámico
function svgCarro(colorHex, pintado = false, esFrente = false, esEnfilandose = false) {
    const bodyColor = pintado ? colorHex : (esEnfilandose ? "#ffffff" : "#f8fafc");
    const strokeColor = pintado ? "rgba(0,0,0,0.25)" : (esFrente ? "#8b5cf6" : (esEnfilandose ? "#f59e0b" : "#94a3b8"));
    const strokeWidth = esFrente ? "2.5" : (esEnfilandose ? "2" : "1.5");
    const strokeDash = esEnfilandose ? 'stroke-dasharray="4 2"' : "";
    const opacity = esEnfilandose ? 'opacity="0.85"' : "";

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" class="coche-svg-inline ${pintado ? 'anim-pintado' : ''}" ${opacity}>
      <!-- Sombra debajo -->
      <ellipse cx="32" cy="36" rx="26" ry="3" fill="rgba(0,0,0,0.1)"/>
      <!-- Carrocería principal -->
      <path d="M6 26 L10 16 Q12 11 18 11 L42 11 Q48 11 51 16 L56 22 Q60 23 60 27 L60 31 L4 31 L4 28 Q4 26 6 26 Z" 
            fill="${bodyColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${strokeDash} stroke-linejoin="round"/>
      <!-- Ventanas con reflejo -->
      <path d="M15 17 Q16 14 19 14 L29 14 L29 21 L13 21 Z" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="0.8"/>
      <path d="M32 14 L41 14 Q45 14 47 17 L50 21 L32 21 Z" fill="#e0e7ff" stroke="#cbd5e1" stroke-width="0.8"/>
      <!-- Línea manija -->
      <line x1="26" y1="23" x2="30" y2="23" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Llantas delanteras y traseras con rin -->
      <circle cx="17" cy="31" r="6" fill="#1e293b"/>
      <circle cx="17" cy="31" r="3" fill="#cbd5e1"/>
      <circle cx="17" cy="31" r="1.2" fill="#64748b"/>
      <circle cx="48" cy="31" r="6" fill="#1e293b"/>
      <circle cx="48" cy="31" r="3" fill="#cbd5e1"/>
      <circle cx="48" cy="31" r="1.2" fill="#64748b"/>
      <!-- Faros -->
      <rect x="55" y="24" width="4" height="3" rx="1" fill="#fde68a" stroke="#d97706" stroke-width="0.5"/>
      <rect x="5" y="25" width="2" height="3" rx="0.5" fill="#ef4444"/>
    </svg>`;
}

// Sintetizador de sonido por Web Audio API
function reproducirSonido(tipo) {
    if (!sonidoActivo) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (tipo === "exito") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.22);
        } else if (tipo === "error") {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sawtooth";
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(160, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch {}
}

function renderPaleta() {
    const div = document.getElementById("divPaletaColores");
    if (!div) return;
    div.innerHTML = PALETA_COLORES.map(c => `
        <button type="button" class="btn-color-paleta" data-color="${c.nombre}"
            style="background:${c.hex}; color:${c.texto};">
            <span class="muestra-color" style="background:${c.hex}; border:2px solid ${c.texto === '#000' ? '#94a3b8' : '#fff'};"></span>
            <span>${c.nombre}</span>
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
        lblColaEstado.textContent = "¡PELIGRO: 4 o más carros!";
        lblColaEstado.style.color = "#dc2626";
        lblColaEstado.style.fontWeight = "bold";
    } else {
        lblColaEstado.textContent = "cola de atención (FIFO)";
        lblColaEstado.style.color = "";
        lblColaEstado.style.fontWeight = "";
    }

    // Dibujar la cola de coches
    const divCola = document.getElementById("divColaCochesVisual");
    if (estado.carros.length === 0) {
        divCola.innerHTML = `<div class="pista-vacia">La cola está vacía. Llega un carro en breve...</div>`;
    } else {
        divCola.innerHTML = estado.carros.map((carro, idx) => {
            const esFrente = idx === 0;
            const esFinal = idx === estado.carros.length - 1;
            const objColor = PALETA_COLORES.find(c => c.nombre.toLowerCase() === carro.colorObjetivo.toLowerCase()) || { hex: carro.colorHex, texto: "#fff" };

            return `
                <div id="cardCarro_${carro.id}" class="coche-tarjeta ${esFrente ? 'coche-frente' : ''}">
                    <div class="coche-header">
                        ${esFrente 
                            ? '<span class="tag tag-frente" style="font-weight:800; font-size:.72rem;">👉 FRENTE (Atendiendo)</span>' 
                            : `<span class="tag" style="font-size:.75rem;">#${idx + 1} en cola</span>`}
                    </div>
                    <div class="coche-grafico">
                        ${svgCarro(carro.colorHex, false, esFrente, false)}
                    </div>
                    <div class="etiqueta-color-badge" style="background:${objColor.hex}; color:${objColor.texto};" title="Haz clic en este color en la paleta para atenderlo">
                        ${carro.colorObjetivo}
                    </div>
                </div>`;
        }).join("");
    }

    // Actualizar coche atendido (muestra el último carro que fue pintado con éxito)
    const slotAtendido = document.getElementById("cocheAtendidoVisual");
    const atendidoActual = estado.ultimoAtendido || ultimoAtendido;
    if (atendidoActual) {
        slotAtendido.className = "coche-tarjeta atendido-exito";
        slotAtendido.innerHTML = `
            <div class="coche-header">
                <span class="tag" style="background:#dcfce7; color:#166534; font-size:.72rem;">✔ Listo</span>
            </div>
            <div class="coche-grafico">
                ${svgCarro(atendidoActual.colorHex, true, false, false)}
            </div>
            <span class="tag" style="background:${atendidoActual.colorHex}; color:#fff; font-size:.8rem; font-weight:700;">
                ${atendidoActual.colorObjetivo || "Pintado"}
            </span>`;
    }

    // Actualizar coche enfilándose (slot derecho)
    const slotEnfilandoseSvg = document.getElementById("cocheEnfilandoseSvg");
    if (slotEnfilandoseSvg) {
        slotEnfilandoseSvg.innerHTML = svgCarro("#94a3b8", false, false, true);
    }
    const lblEnf = document.getElementById("lblEnfilandoseTiempo");
    if (lblEnf) {
        lblEnf.textContent = `Llega en ${segundosProximo}s`;
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
        segundosProximo = est.intervaloLlegada || 20;
        pintarTablero(est);
        // Iniciar el temporizador de enfilamiento en segundo plano automáticamente
        if (!timerJuego && !est.juegoTerminado) {
            iniciarCicloEnfilar(est.intervaloLlegada || 20);
        }
    } catch (err) {
        mostrarMensaje("lblMensajeJuego", err.message, "error");
    }
}

async function iniciarNuevaPartida(ejemploPdf = false) {
    try {
        detenerTemporizadores();
        tiempoSegundos = 0;
        document.getElementById("lblJuegoTiempo").textContent = "00:00";
        document.getElementById("divFinJuegoModal").classList.add("oculto");

        const r = await api("/api/colas/juego/iniciar" + (ejemploPdf ? "?reiniciar=true" : ""), "POST");
        ultimoAtendido = r.estado.ultimoAtendido || { id: 0, colorObjetivo: "Amarillo", colorHex: "#EAB308" };
        mostrarMensaje("lblMensajeJuego", "✔ " + r.mensaje, "ok");
        pintarTablero(r.estado);

        // Iniciar cronómetro de tiempo jugado
        timerCronometro = setInterval(() => {
            tiempoSegundos++;
            const m = String(Math.floor(tiempoSegundos / 60)).padStart(2, "0");
            const s = String(tiempoSegundos % 60).padStart(2, "0");
            document.getElementById("lblJuegoTiempo").textContent = `${m}:${s}`;
        }, 1000);

        // Iniciar ciclo de llegada de coches
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
    const lblEnf = document.getElementById("lblEnfilandoseTiempo");
    if (lbl) lbl.textContent = `${Math.max(0, restantes)} s`;
    if (lblEnf) lblEnf.textContent = `Llega en ${Math.max(0, restantes)} s`;
    if (bar) {
        const pct = Math.min(100, Math.max(0, ((total - restantes) / total) * 100));
        bar.style.width = `${pct}%`;
    }
}

async function pintarCarroFrente(colorElegido) {
    // Si la partida no ha comenzado o terminó, reiniciar automáticamente
    if (!estadoJuego || estadoJuego.juegoTerminado) {
        await iniciarNuevaPartida(true);
    }

    if (estadoJuego.carros.length === 0) {
        return mostrarMensaje("lblMensajeJuego", "Espera un momento a que llegue un nuevo carro...", "info");
    }

    const carroFrente = estadoJuego.carros[0];

    try {
        const r = await api("/api/colas/juego/pintar", "POST", { color: colorElegido });
        reproducirSonido("exito");
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
        reproducirSonido("error");
        mostrarMensaje("lblMensajeJuego", "✖ " + err.message, "error");
        // Animación visual de sacudida en la tarjeta del frente
        const cardFrente = document.getElementById(`cardCarro_${carroFrente.id}`);
        if (cardFrente) {
            cardFrente.classList.add("shake-error");
            setTimeout(() => cardFrente.classList.remove("shake-error"), 400);
        }
    }
}

function finalizarJuegoPartida(estado) {
    detenerTemporizadores();
    reproducirSonido("error");
    mostrarMensaje("lblMensajeJuego", "🚨 ¡Fin del juego! La cola de atención se saturó con 5 carros.", "error");

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

// Botones de acción
document.getElementById("btnIniciarJuego").addEventListener("click", () => iniciarNuevaPartida(false));
document.getElementById("btnEjemploPdf").addEventListener("click", () => iniciarNuevaPartida(true));
document.getElementById("btnReintentar").addEventListener("click", () => iniciarNuevaPartida(true));

const btnSonido = document.getElementById("btnToggleSonido");
if (btnSonido) {
    btnSonido.addEventListener("click", () => {
        sonidoActivo = !sonidoActivo;
        btnSonido.textContent = sonidoActivo ? "🔊 Sonido: ON" : "🔇 Sonido: OFF";
    });
}

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
