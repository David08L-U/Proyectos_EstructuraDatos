// ============================================================
//  listas.js – Lógica de la interfaz de los ejercicios de Listas
// ============================================================

const moneda = n => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Evita que el texto del usuario se interprete como HTML
const seguro = t => String(t).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

// =====================================================================
//  EJERCICIO 1: PRODUCTOS DISPONIBLES Y RETIRADOS (Víctor)
// =====================================================================

function pintarSupermercado(estado) {
    document.getElementById("lblTotalDisponibles").textContent = estado.totalDisponibles;
    document.getElementById("lblTotalRetirados").textContent = estado.totalRetirados;
    document.getElementById("lblTotalProcesadosSuper").textContent = estado.totalDisponibles + estado.totalRetirados;

    const tbdDisp = document.getElementById("tbdSuperDisponibles");
    if (estado.disponibles.length === 0) {
        tbdDisp.innerHTML = `<tr><td colspan="6" class="texto-suave">El almacén está vacío. Presiona "Escanear producto".</td></tr>`;
    } else {
        tbdDisp.innerHTML = estado.disponibles.map(p => `
            <tr>
                <td><span class="clave">${p.clave}</span></td>
                <td><strong>${seguro(p.nombre)}</strong></td>
                <td>${p.cantidad}</td>
                <td>${moneda(p.precio)}</td>
                <td>${moneda(p.precio * p.cantidad)}</td>
                <td>
                    <button class="btn btn-peligro btn-sm btn-retirar-prod" data-clave="${p.clave}">Retirar</button>
                </td>
            </tr>`).join("");
    }

    const tbdRet = document.getElementById("tbdSuperRetirados");
    if (estado.retirados.length === 0) {
        tbdRet.innerHTML = `<tr><td colspan="6" class="texto-suave">Aún no se han retirado productos del almacén.</td></tr>`;
    } else {
        tbdRet.innerHTML = estado.retirados.map(p => `
            <tr>
                <td><span class="clave">${p.clave}</span></td>
                <td><strong>${seguro(p.nombre)}</strong></td>
                <td>${p.cantidad}</td>
                <td>${moneda(p.precio)}</td>
                <td>${moneda(p.precio * p.cantidad)}</td>
                <td><span class="tag tag-final" style="background:#fee2e2; color:#b91c1c;">Retirado</span></td>
            </tr>`).join("");
    }
}

async function cargarSupermercado() {
    try {
        const estado = await api("/api/listas/supermercado");
        pintarSupermercado(estado);
    } catch (err) {
        mostrarMensaje("lblMensajeSuper", err.message, "error");
    }
}

document.getElementById("btnEscanearUno").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/supermercado/escanear", "POST", { cantidad: 1 });
        mostrarMensaje("lblMensajeSuper", "✔ " + r.mensaje, "ok");
        pintarSupermercado(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeSuper", err.message, "error");
    }
});

document.getElementById("btnEscanearVarios").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/supermercado/escanear", "POST", { cantidad: 5 });
        mostrarMensaje("lblMensajeSuper", "✔ " + r.mensaje, "ok");
        pintarSupermercado(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeSuper", err.message, "error");
    }
});

document.getElementById("frmRetirarSuper").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtClave = document.getElementById("txtClaveRetirarSuper");
    const clave = txtClave.value.trim();

    if (clave === "")
        return mostrarMensaje("lblMensajeRetirarSuper", "Hay datos faltantes: escribe la clave del producto.", "error");
    if (!/^\d+$/.test(clave))
        return mostrarMensaje("lblMensajeRetirarSuper", "Clave: introducir sólo números enteros.", "error");

    try {
        const r = await api("/api/listas/supermercado/retirar/" + encodeURIComponent(clave), "POST");
        mostrarMensaje("lblMensajeRetirarSuper", "✔ " + r.mensaje, "ok");
        txtClave.value = "";
        pintarSupermercado(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeRetirarSuper", err.message, "error");
    }
});

document.getElementById("tbdSuperDisponibles").addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-retirar-prod");
    if (!btn) return;
    const clave = btn.dataset.clave;
    try {
        const r = await api("/api/listas/supermercado/retirar/" + encodeURIComponent(clave), "POST");
        mostrarMensaje("lblMensajeRetirarSuper", "✔ " + r.mensaje, "ok");
        pintarSupermercado(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeRetirarSuper", err.message, "error");
    }
});

document.getElementById("btnVaciarSuper").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/supermercado", "DELETE");
        mostrarMensaje("lblMensajeSuper", "✔ " + r.mensaje, "ok");
        document.getElementById("txtClaveRetirarSuper").value = "";
        pintarSupermercado(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeSuper", err.message, "error");
    }
});

// =====================================================================
//  EJERCICIO 2: PARES E IMPARES (Víctor)
// =====================================================================

function pintarParesImpares(estado) {
    document.getElementById("lblTotalNumeros").textContent = estado.totalTodos;
    document.getElementById("lblTotalPares").textContent = estado.totalPares;
    document.getElementById("lblTotalImpares").textContent = estado.totalImpares;

    document.getElementById("lblDetallePares").textContent = `${estado.totalPares} números (divisibles entre 2)`;
    document.getElementById("lblDetalleImpares").textContent = `${estado.totalImpares} números`;

    const divTodos = document.getElementById("divListaTodosNumeros");
    if (estado.todos.length === 0) {
        divTodos.innerHTML = `<p class="texto-suave">Aún no se han generado números. Haz clic en "Generar y clasificar".</p>`;
    } else {
        divTodos.innerHTML = estado.todos.map(n =>
            `<span class="chip ${n % 2 === 0 ? 'chip-par' : 'chip-impar'}">${n}</span>`
        ).join("");
    }

    const divPares = document.getElementById("divListaPares");
    if (estado.pares.length === 0) {
        divPares.innerHTML = `<p class="texto-suave">Sin elementos pares.</p>`;
    } else {
        divPares.innerHTML = estado.pares.map(n => `<span class="chip chip-par">${n}</span>`).join("");
    }

    const divImpares = document.getElementById("divListaImpares");
    if (estado.impares.length === 0) {
        divImpares.innerHTML = `<p class="texto-suave">Sin elementos impares.</p>`;
    } else {
        divImpares.innerHTML = estado.impares.map(n => `<span class="chip chip-impar">${n}</span>`).join("");
    }
}

async function cargarParesImpares() {
    try {
        const estado = await api("/api/listas/pareseimpares");
        pintarParesImpares(estado);
    } catch (err) {
        mostrarMensaje("lblMensajeParesImpares", err.message, "error");
    }
}

document.getElementById("frmGenerarParesImpares").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtCantidad = document.getElementById("txtCantidadAleatorios").value.trim();
    const txtMin = document.getElementById("txtMinAleatorios").value.trim();
    const txtMax = document.getElementById("txtMaxAleatorios").value.trim();

    if (!/^\d+$/.test(txtCantidad))
        return mostrarMensaje("lblMensajeParesImpares", "Cantidad: introducir sólo números enteros.", "error");
    if (!/^-?\d+$/.test(txtMin) || !/^-?\d+$/.test(txtMax))
        return mostrarMensaje("lblMensajeParesImpares", "Rango: introducir sólo números enteros.", "error");

    try {
        const r = await api("/api/listas/pareseimpares/generar", "POST", {
            cantidad: txtCantidad,
            min: txtMin,
            max: txtMax
        });
        mostrarMensaje("lblMensajeParesImpares", "✔ " + r.mensaje, "ok");
        pintarParesImpares(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeParesImpares", err.message, "error");
    }
});

document.getElementById("frmNumeroManual").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtNum = document.getElementById("txtNumeroManual");
    const num = txtNum.value.trim();

    if (num === "")
        return mostrarMensaje("lblMensajeParesImpares", "Hay datos faltantes: escribe un número.", "error");
    if (!/^-?\d+$/.test(num))
        return mostrarMensaje("lblMensajeParesImpares", "Introducir sólo números enteros.", "error");

    try {
        const r = await api("/api/listas/pareseimpares/agregar", "POST", { numero: num });
        mostrarMensaje("lblMensajeParesImpares", "✔ " + r.mensaje, "ok");
        txtNum.value = "";
        pintarParesImpares(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeParesImpares", err.message, "error");
    }
});

document.getElementById("btnVaciarParesImpares").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/pareseimpares", "DELETE");
        mostrarMensaje("lblMensajeParesImpares", "✔ " + r.mensaje, "ok");
        pintarParesImpares(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeParesImpares", err.message, "error");
    }
});

// =====================================================================
//  EJERCICIO 3: APROBADOS Y REPROBADOS (Víctor)
// =====================================================================

function pintarAlumnos(estado) {
    document.getElementById("lblTotalAprobados").textContent = estado.totalAprobados;
    document.getElementById("lblTotalReprobados").textContent = estado.totalReprobados;
    document.getElementById("lblPromedioAlumnos").textContent = Number(estado.promedioGeneral).toFixed(2);

    const tbdAprob = document.getElementById("tbdAlumnosAprobados");
    if (estado.aprobados.length === 0) {
        tbdAprob.innerHTML = `<tr><td colspan="5" class="texto-suave">No hay alumnos aprobados registrados.</td></tr>`;
    } else {
        tbdAprob.innerHTML = estado.aprobados.map((a, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${seguro(a.nombre)}</strong></td>
                <td><strong style="color:#16a34a;">${Number(a.calificacion).toFixed(2)}</strong></td>
                <td><span class="tag" style="background:#dcfce7; color:#166534;">Aprobado</span></td>
                <td><button class="btn btn-secundario btn-sm btn-eliminar-alumno" data-id="${a.id}">✕</button></td>
            </tr>`).join("");
    }

    const tbdReprob = document.getElementById("tbdAlumnosReprobados");
    if (estado.reprobados.length === 0) {
        tbdReprob.innerHTML = `<tr><td colspan="5" class="texto-suave">No hay alumnos reprobados registrados.</td></tr>`;
    } else {
        tbdReprob.innerHTML = estado.reprobados.map((a, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${seguro(a.nombre)}</strong></td>
                <td><strong style="color:#dc2626;">${Number(a.calificacion).toFixed(2)}</strong></td>
                <td><span class="tag" style="background:#fee2e2; color:#991b1b;">Reprobado (&lt; 7)</span></td>
                <td><button class="btn btn-secundario btn-sm btn-eliminar-alumno" data-id="${a.id}">✕</button></td>
            </tr>`).join("");
    }
}

async function cargarAlumnos() {
    try {
        const estado = await api("/api/listas/alumnos");
        pintarAlumnos(estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAlumnos", err.message, "error");
    }
}

document.getElementById("frmCapturarAlumno").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txtNom = document.getElementById("txtNombreAlumno");
    const txtCal = document.getElementById("txtCalificacionAlumno");

    const nombre = txtNom.value.trim();
    const calificacion = txtCal.value.trim();

    if (nombre === "" || calificacion === "")
        return mostrarMensaje("lblMensajeAlumnos", "Hay datos faltantes: ingresa el nombre y la calificación.", "error");

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{2,50}$/.test(nombre))
        return mostrarMensaje("lblMensajeAlumnos", "Nombre de alumno: introduce sólo letras.", "error");

    if (!/^\d+([.,]\d{1,2})?$/.test(calificacion))
        return mostrarMensaje("lblMensajeAlumnos", "Calificación: introducir sólo números (ej. 8.5).", "error");

    const numCalif = Number(calificacion.replace(",", "."));
    if (numCalif < 0 || numCalif > 10)
        return mostrarMensaje("lblMensajeAlumnos", "La calificación debe estar entre 0 y 10.", "error");

    try {
        const r = await api("/api/listas/alumnos", "POST", { nombre, calificacion });
        mostrarMensaje("lblMensajeAlumnos", "✔ " + r.mensaje, "ok");
        txtNom.value = "";
        txtCal.value = "";
        txtNom.focus();
        pintarAlumnos(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAlumnos", err.message, "error");
    }
});

document.getElementById("btnDemoAlumnos").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/alumnos/demo", "POST");
        mostrarMensaje("lblMensajeAlumnos", "✔ " + r.mensaje, "ok");
        pintarAlumnos(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAlumnos", err.message, "error");
    }
});

document.getElementById("btnVaciarAlumnos").addEventListener("click", async () => {
    try {
        const r = await api("/api/listas/alumnos", "DELETE");
        mostrarMensaje("lblMensajeAlumnos", "✔ " + r.mensaje, "ok");
        pintarAlumnos(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAlumnos", err.message, "error");
    }
});

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-eliminar-alumno");
    if (!btn) return;
    const id = btn.dataset.id;
    try {
        const r = await api("/api/listas/alumnos/" + encodeURIComponent(id), "DELETE");
        mostrarMensaje("lblMensajeAlumnos", "✔ " + r.mensaje, "ok");
        pintarAlumnos(r.estado);
    } catch (err) {
        mostrarMensaje("lblMensajeAlumnos", err.message, "error");
    }
});

cargarSupermercado();
cargarParesImpares();
cargarAlumnos();

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
