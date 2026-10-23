// ============================================================
//  listas.js – Lógica de la interfaz de los ejercicios de Listas
// ============================================================

const moneda = n => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Evita que el texto del usuario se interprete como HTML
const seguro = t => String(t).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// =====================================================================
//  EJERCICIO 4: ELIMINAR Y ORDENAR PRODUCTOS
// =====================================================================
let estadoCompra = null;        // última respuesta de la API
let ordenActual = "nombre";     // "nombre" | "captura"

// ---------- Validaciones en el navegador (la API también valida) ----------
function validarProducto(nombre, precio, cantidad) {
    if (nombre === "" || precio === "" || cantidad === "")
        return "Hay datos faltantes: captura nombre, precio y cantidad.";
    if (nombre.length < 2)
        return "El nombre debe tener al menos 2 caracteres.";
    if (!/^\d+([.,]\d{1,2})?$/.test(precio))
        return "Precio: introducir sólo números (ej. 25.50).";
    if (Number(precio.replace(",", ".")) <= 0)
        return "El precio debe ser mayor a 0.";
    if (!/^\d+$/.test(cantidad))
        return "Cantidad: introducir sólo números enteros.";
    if (Number(cantidad) < 1 || Number(cantidad) > 999)
        return "La cantidad debe estar entre 1 y 999.";
    return null;
}

// ---------- Agregar ----------
document.getElementById("frmAgregarProducto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtNombre = document.getElementById("txtNombreProducto");
    const txtPrecio = document.getElementById("txtPrecioProducto");
    const txtCantidad = document.getElementById("txtCantidadProducto");

    const nombre = txtNombre.value.trim();
    const precio = txtPrecio.value.trim();
    const cantidad = txtCantidad.value.trim();

    const error = validarProducto(nombre, precio, cantidad);
    if (error) return mostrarMensaje("lblMensajeAgregar", error, "error");

    try {
        const r = await api("/api/listas/compra", "POST", { nombre, precio, cantidad });
        mostrarMensaje("lblMensajeAgregar", "✔ " + r.mensaje, "ok");
        txtNombre.value = ""; txtPrecio.value = ""; txtCantidad.value = "";
        txtNombre.focus();
        pintarCompra(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAgregar", err.message, "error");
    }
});

document.getElementById("frmAgregarProducto").addEventListener("reset", () =>
    mostrarMensaje("lblMensajeAgregar", "", "info"));

// ---------- Eliminar por clave ----------
document.getElementById("frmEliminarProducto").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtClave = document.getElementById("txtClaveEliminar");
    const clave = txtClave.value.trim();

    if (clave === "") return mostrarMensaje("lblMensajeEliminar", "Hay datos faltantes: escribe la clave del producto.", "error");
    if (!/^\d+$/.test(clave)) return mostrarMensaje("lblMensajeEliminar", "Clave: introducir sólo números enteros.", "error");

    try {
        const r = await api("/api/listas/compra/" + encodeURIComponent(clave), "DELETE");
        mostrarMensaje("lblMensajeEliminar", "✔ " + r.mensaje, "ok");
        txtClave.value = "";
        pintarCompra(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeEliminar", err.message, "error");
    }
});

// ---------- Vaciar ----------
document.getElementById("btnVaciarLista").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/compra", "DELETE");
        mostrarMensaje("lblMensajeEliminar", "✔ " + r.mensaje, "ok");
        pintarCompra(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeEliminar", err.message, "error");
    }
});

// ---------- Cambiar el orden de la tabla ----------
document.querySelectorAll("#ej4 .opcion").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#ej4 .opcion").forEach(b => b.classList.remove("activa"));
        btn.classList.add("activa");
        ordenActual = btn.dataset.orden;
        if (estadoCompra) pintarCompra(estadoCompra);
    });
});

// Clic en una fila → pone su clave en el campo de eliminar
document.getElementById("tbdProductos").addEventListener("click", (e) => {
    const fila = e.target.closest("tr[data-clave]");
    if (!fila) return;
    const txtClave = document.getElementById("txtClaveEliminar");
    txtClave.value = fila.dataset.clave;
    txtClave.focus();
});

// ---------- Mostrar ----------
function pintarCompra(estado) {
    estadoCompra = estado;
    const lista = ordenActual === "nombre" ? estado.ordenados : estado.productos;

    document.getElementById("lblTotalProductos").textContent = estado.totalProductos;
    document.getElementById("lblTotalArticulos").textContent = estado.totalArticulos;
    document.getElementById("lblTotalCompra").textContent = moneda(estado.total);

    const tbd = document.getElementById("tbdProductos");
    if (lista.length === 0) {
        tbd.innerHTML = `<tr><td colspan="5" class="texto-suave">La lista está vacía. Agrega un producto.</td></tr>`;
        return;
    }
    tbd.innerHTML = lista.map(p => `
        <tr data-clave="${p.clave}" title="Clic para eliminar este producto">
            <td><span class="clave">${p.clave}</span></td>
            <td><strong>${seguro(p.nombre)}</strong></td>
            <td>${moneda(p.precio)}</td>
            <td>${p.cantidad}</td>
            <td>${moneda(p.precio * p.cantidad)}</td>
        </tr>`).join("") + `
        <tr class="fila-total">
            <td colspan="4">Costo total de la compra</td>
            <td>${moneda(estado.total)}</td>
        </tr>`;
}

async function cargarCompra() {
    try {
        pintarCompra(await api("/api/listas/compra"));
    } catch (err) {
        mostrarMensaje("lblMensajeAgregar", err.message, "error");
    }
}

cargarCompra();

// =====================================================================
//  EJERCICIO 5: LISTAR PALABRAS POR LETRA
// =====================================================================

document.getElementById("frmPalabras").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txt = document.getElementById("txtPalabras");
    const texto = txt.value.trim();

    // Validación en el navegador (la API también valida)
    if (texto === "")
        return mostrarMensaje("lblMensajePalabras", "Hay datos faltantes: escribe al menos una palabra.", "error");
    const invalidas = texto.split(/[\s,;]+/).filter(p => p && !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+$/.test(p));
    if (invalidas.length > 0)
        return mostrarMensaje("lblMensajePalabras", "Introduce sólo letras. No válidas: " + invalidas.join(", "), "error");

    try {
        const r = await api("/api/listas/palabras", "POST", { texto });
        mostrarMensaje("lblMensajePalabras", (r.agregadas.length > 0 ? "✔ " : "") + r.mensaje,
            r.agregadas.length > 0 ? "ok" : "info");
        txt.value = "";
        txt.focus();
        pintarPalabras(r.estado, r.listasNuevas, r.agregadas);
    } catch (err) {
        mostrarMensaje("lblMensajePalabras", err.message, "error");
    }
});

// Enter agrega (Shift+Enter hace salto de línea)
document.getElementById("txtPalabras").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("frmPalabras").requestSubmit();
    }
});

document.getElementById("btnEjemploPalabras").addEventListener("click", () => {
    document.getElementById("txtPalabras").value = "Fresa, Fresca, Orilla, Oso, Peso, Pez";
});

document.getElementById("btnVaciarPalabras").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/palabras", "DELETE");
        mostrarMensaje("lblMensajePalabras", "✔ " + r.mensaje, "ok");
        pintarPalabras(r.estado, [], []);
    } catch (err) {
        mostrarMensaje("lblMensajePalabras", err.message, "error");
    }
});

// Dibuja la Lista 1 (todas) y una tarjeta por cada letra
function pintarPalabras(estado, listasNuevas = [], agregadas = []) {
    const div = document.getElementById("divListasPalabras");
    document.getElementById("lblTotalListas").textContent =
        estado.todas.length > 0 ? `· ${estado.totalListas} listas` : "";

    if (estado.todas.length === 0) {
        div.innerHTML = `<p class="texto-suave">Aún no hay palabras. Agrega algunas para ver las listas.</p>`;
        return;
    }

    const chips = palabras => palabras.map(p =>
        `<span class="chip ${agregadas.includes(p) ? "chip-nueva" : ""}">${seguro(p)}</span>`).join("");

    let html = `
        <div class="lista-card lista-general">
            <div class="lista-card-titulo">
                <span class="letra-grande">★</span>
                <div><strong>Lista 1</strong><small>Todas las palabras · ${estado.todas.length}</small></div>
            </div>
            <div class="chips">${chips(estado.todas)}</div>
        </div>`;

    html += estado.grupos.map(g => `
        <div class="lista-card ${listasNuevas.includes(g.letra) ? "lista-nueva" : ""}">
            <div class="lista-card-titulo">
                <span class="letra-grande">${seguro(g.letra)}</span>
                <div><strong>Lista ${g.numero}</strong><small>Letra ${seguro(g.letra)} · ${g.palabras.length}</small></div>
                ${listasNuevas.includes(g.letra) ? '<span class="tag tag-frente">NUEVA</span>' : ""}
            </div>
            <div class="chips">${chips(g.palabras)}</div>
        </div>`).join("");

    div.innerHTML = html;
}

async function cargarPalabras() {
    try {
        pintarPalabras(await api("/api/listas/palabras"));
    } catch (err) {
        mostrarMensaje("lblMensajePalabras", err.message, "error");
    }
}

cargarPalabras();
