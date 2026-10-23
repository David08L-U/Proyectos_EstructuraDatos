// ============================================================
//  pilas.js – Lógica de la interfaz de los ejercicios de Pilas
// ============================================================

const esperar = ms => new Promise(r => setTimeout(r, ms));

// Dibuja una pila vertical: el primer elemento del arreglo es el TOPE
function dibujarPila(idDiv, elementos) {
    const div = document.getElementById(idDiv);
    if (elementos.length === 0) {
        div.innerHTML = `<p class="texto-suave">Vacía</p>`;
        return;
    }
    // Evita que caracteres como < o > se interpreten como HTML
    const seguro = t => String(t).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
    div.innerHTML = elementos.map((e, i) =>
        `<div class="celda-pila">${i === 0 ? '<span class="tag tag-frente">TOPE</span>' : ""}${seguro(e)}</div>`
    ).join("");
}

// =====================================================================
//  EJERCICIO 1: INVERTIR PALABRA
// =====================================================================
let animandoInvertir = false;

document.getElementById("frmInvertir").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (animandoInvertir) return;

    const txt = document.getElementById("txtPalabraInvertir");
    const palabra = txt.value.trim();
    const divRes = document.getElementById("divResultadoInvertir");
    divRes.classList.add("oculto");

    // Validación en el navegador (la API también valida)
    if (palabra === "") return mostrarMensaje("lblMensajeInvertir", "Hay datos faltantes: escribe una palabra.", "error");
    if (palabra.includes(" ")) return mostrarMensaje("lblMensajeInvertir", "Introduce sólo una palabra (sin espacios).", "error");

    try {
        const r = await api("/api/pilas/invertir", "POST", { palabra });
        mostrarMensaje("lblMensajeInvertir", "", "info");
        await animarInversion(r);
    } catch (err) {
        mostrarMensaje("lblMensajeInvertir", err.message, "error");
    }
});

document.getElementById("frmInvertir").addEventListener("reset", () => {
    if (animandoInvertir) return;
    mostrarMensaje("lblMensajeInvertir", "", "info");
    document.getElementById("divResultadoInvertir").classList.add("oculto");
    document.getElementById("lblPasoPila").textContent = "";
    dibujarPila("divPilaVisual", []);
});

// Muestra paso a paso: Push de cada letra y luego Pop
async function animarInversion(r) {
    animandoInvertir = true;
    const btn = document.getElementById("btnInvertir");
    btn.disabled = true;

    const lblPaso = document.getElementById("lblPasoPila");
    const lblOriginal = document.getElementById("lblOriginal");
    const lblInvertida = document.getElementById("lblInvertida");
    const divRes = document.getElementById("divResultadoInvertir");

    lblOriginal.textContent = r.original;
    lblInvertida.textContent = "";
    divRes.classList.remove("oculto");

    const velocidad = Math.max(120, 600 - r.original.length * 30);

    // 1) PUSH: la pila crece (r.pila viene con el tope primero)
    const llena = r.pila;
    for (let i = 1; i <= llena.length; i++) {
        lblPaso.textContent = `· Push('${llena[llena.length - i]}')`;
        dibujarPila("divPilaVisual", llena.slice(llena.length - i));
        await esperar(velocidad);
    }

    // 2) POP: sale el tope y se agrega al resultado
    let pila = [...llena];
    while (pila.length > 0) {
        const letra = pila.shift();
        lblPaso.textContent = `· Pop() → '${letra}'`;
        lblInvertida.textContent += letra;
        dibujarPila("divPilaVisual", pila);
        await esperar(velocidad);
    }

    lblPaso.textContent = "· vacía";
    mostrarMensaje("lblMensajeInvertir", `✔ "${r.original}" invertida es "${r.invertida}".`, "ok");
    btn.disabled = false;
    animandoInvertir = false;
}
