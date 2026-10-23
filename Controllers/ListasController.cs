using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Proyectos_Estructuras.Models;

namespace Proyectos_Estructuras.Controllers
{
    // Rutas: /api/listas/...
    [ApiController]
    [Route("api/[controller]")]
    public class ListasController : ControllerBase
    {
        // "static" para que los datos NO se borren entre cada petición
        private static readonly Lista<Producto> almacen = new Lista<Producto>();

        // Prueba rápida: GET /api/listas/estado
        [HttpGet("estado")]
        public IActionResult Estado()
        {
            return Ok(new { mensaje = "API de Listas funcionando", productos = almacen.Contar() });
        }

        // TODO Ejercicio 1: Productos disponibles y retirados
        // TODO Ejercicio 2: Pares e impares
        // TODO Ejercicio 3: Aprobados y reprobados
        // =====================================================================
        //  EJERCICIO 5: LISTAR PALABRAS POR LETRA
        //  - Lista general con TODAS las palabras (Lista 1)
        //  - Una lista por cada letra inicial; si la letra no tiene lista,
        //    se crea una nueva automáticamente
        // =====================================================================

        private static readonly Lista<string> todasLasPalabras = new Lista<string>();
        private static readonly Lista<GrupoLetra> listasPorLetra = new Lista<GrupoLetra>();
        private static readonly object candadoPalabras = new object();

        public class PalabrasDto
        {
            public string? Texto { get; set; }
        }

        // Letra inicial en mayúscula y sin acento (Á → A), pero la Ñ se respeta
        private static char LetraInicial(string palabra)
        {
            char letra = char.ToUpper(palabra[0], cultura);
            return letra switch
            {
                'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' or 'Ü' => 'U',
                _ => letra
            };
        }

        private static int CompararTexto(string a, string b) =>
            string.Compare(a, b, cultura, CompareOptions.IgnoreCase);

        // Convierte las listas a arreglos para mandarlas como JSON
        private static object EstadoPalabras()
        {
            var grupos = listasPorLetra.ObtenerTodos().Select((g, i) => new
            {
                numero = i + 2,                     // Lista 1 es la general
                letra = g.Letra.ToString(),
                palabras = g.Palabras.ObtenerTodos()
            });

            return new
            {
                todas = todasLasPalabras.ObtenerTodos(),
                grupos,
                totalListas = listasPorLetra.Contar() + 1
            };
        }

        // GET /api/listas/palabras
        [HttpGet("palabras")]
        public IActionResult VerPalabras()
        {
            lock (candadoPalabras)
                return Ok(EstadoPalabras());
        }

        // POST /api/listas/palabras  → agrega una o varias palabras
        [HttpPost("palabras")]
        public IActionResult AgregarPalabras([FromBody] PalabrasDto datos)
        {
            string texto = (datos.Texto ?? "").Trim();

            // ---- Validaciones ----
            if (texto == "")
                return BadRequest(new { mensaje = "Hay datos faltantes: escribe al menos una palabra." });

            // Separar las palabras por espacios, comas o punto y coma
            string[] palabras = Regex.Split(texto, @"[\s,;]+")
                                     .Where(p => p != "")
                                     .ToArray();

            if (palabras.Length > 50)
                return BadRequest(new { mensaje = "Máximo 50 palabras por captura." });

            string[] invalidas = palabras.Where(p => !Regex.IsMatch(p, @"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]{1,30}$")).ToArray();
            if (invalidas.Length > 0)
                return BadRequest(new { mensaje = $"Introduce sólo letras. No válidas: {string.Join(", ", invalidas)}" });

            // ---- Proceso ----
            List<string> agregadas = new List<string>();
            List<string> repetidas = new List<string>();
            List<string> listasNuevas = new List<string>();

            lock (candadoPalabras)
            {
                foreach (string original in palabras)
                {
                    // Primera letra en mayúscula: fresa → Fresa
                    string palabra = char.ToUpper(original[0], cultura) + original.Substring(1).ToLower(cultura);

                    // No se repiten palabras (sin importar mayúsculas)
                    if (todasLasPalabras.Buscar(p => CompararTexto(p, palabra) == 0) != null)
                    {
                        repetidas.Add(palabra);
                        continue;
                    }

                    // 1) Se agrega a la lista general
                    todasLasPalabras.Agregar(palabra);

                    // 2) Se busca la lista de su letra inicial
                    char letra = LetraInicial(palabra);
                    GrupoLetra? grupo = listasPorLetra.Buscar(g => g.Letra == letra);

                    // 3) Si no existe, se crea una lista nueva (ordenada por letra)
                    if (grupo == null)
                    {
                        grupo = new GrupoLetra(letra);
                        listasPorLetra.InsertarOrdenado(grupo,
                            (a, b) => CompararTexto(a.Letra.ToString(), b.Letra.ToString()));
                        listasNuevas.Add(letra.ToString());
                    }

                    // 4) Se inserta la palabra en la lista de su letra (en orden alfabético)
                    grupo.Palabras.InsertarOrdenado(palabra, CompararTexto);
                    agregadas.Add(palabra);
                }

                string mensaje = agregadas.Count > 0
                    ? $"Se agregaron {agregadas.Count} palabra(s)."
                    : "No se agregó ninguna palabra.";
                if (listasNuevas.Count > 0)
                    mensaje += $" Listas nuevas: {string.Join(", ", listasNuevas)}.";
                if (repetidas.Count > 0)
                    mensaje += $" Ya existían: {string.Join(", ", repetidas)}.";

                return Ok(new
                {
                    mensaje,
                    agregadas,
                    repetidas,
                    listasNuevas,
                    estado = EstadoPalabras()
                });
            }
        }

        // DELETE /api/listas/palabras  → vaciar todo
        [HttpDelete("palabras")]
        public IActionResult VaciarPalabras()
        {
            lock (candadoPalabras)
            {
                todasLasPalabras.Limpiar();
                listasPorLetra.Limpiar();
                return Ok(new { mensaje = "Se vaciaron todas las listas.", estado = EstadoPalabras() });
            }
        }

        // =====================================================================
        //  EJERCICIO 4: ELIMINAR Y ORDENAR PRODUCTOS
        //  - Agregar productos (nombre, precio, cantidad) a una lista
        //  - Eliminar por clave de producto
        //  - Mostrar ordenados por nombre y el costo total de la compra
        // =====================================================================

        private static readonly Lista<Producto> listaCompra = new Lista<Producto>();
        private static int siguienteClave = 1;
        private static readonly object candadoCompra = new object();

        // Compara por nombre en español sin importar mayúsculas (á, ñ, etc.)
        private static readonly CultureInfo cultura = new CultureInfo("es-MX");
        private static int CompararPorNombre(Producto a, Producto b) =>
            string.Compare(a.Nombre, b.Nombre, cultura, CompareOptions.IgnoreCase);

        // Llegan como texto para poder validar y dar mensajes claros
        public class ProductoDto
        {
            public string? Nombre { get; set; }
            public string? Precio { get; set; }
            public string? Cantidad { get; set; }
        }

        // Arma la respuesta: lista en orden de captura, lista ordenada y totales
        private static object EstadoCompra()
        {
            // Lista ordenada: se crea una nueva lista insertando cada producto en orden
            Lista<Producto> ordenada = new Lista<Producto>();
            foreach (Producto p in listaCompra.ObtenerTodos())
                ordenada.InsertarOrdenado(p, CompararPorNombre);

            decimal total = 0;
            int articulos = 0;
            foreach (Producto p in listaCompra.ObtenerTodos())
            {
                total += p.Precio * p.Cantidad;
                articulos += p.Cantidad;
            }

            return new
            {
                productos = listaCompra.ObtenerTodos(),   // orden de captura
                ordenados = ordenada.ObtenerTodos(),      // orden alfabético
                totalProductos = listaCompra.Contar(),
                totalArticulos = articulos,
                total
            };
        }

        // GET /api/listas/compra
        [HttpGet("compra")]
        public IActionResult VerCompra()
        {
            lock (candadoCompra)
                return Ok(EstadoCompra());
        }

        // POST /api/listas/compra  → agregar producto
        [HttpPost("compra")]
        public IActionResult AgregarProducto([FromBody] ProductoDto datos)
        {
            string nombre = (datos.Nombre ?? "").Trim();
            string textoPrecio = (datos.Precio ?? "").Trim().Replace(',', '.');
            string textoCantidad = (datos.Cantidad ?? "").Trim();

            // ---- Validaciones ----
            if (nombre == "" || textoPrecio == "" || textoCantidad == "")
                return BadRequest(new { mensaje = "Hay datos faltantes: captura nombre, precio y cantidad." });

            if (nombre.Length < 2 || nombre.Length > 40)
                return BadRequest(new { mensaje = "El nombre debe tener entre 2 y 40 caracteres." });

            if (!decimal.TryParse(textoPrecio, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal precio))
                return BadRequest(new { mensaje = "Precio: introducir sólo números (ej. 25.50)." });

            if (precio <= 0 || precio > 1_000_000)
                return BadRequest(new { mensaje = "El precio debe ser mayor a 0 y menor a 1,000,000." });

            if (!int.TryParse(textoCantidad, out int cantidad))
                return BadRequest(new { mensaje = "Cantidad: introducir sólo números enteros." });

            if (cantidad < 1 || cantidad > 999)
                return BadRequest(new { mensaje = "La cantidad debe estar entre 1 y 999." });

            // ---- Proceso ----
            lock (candadoCompra)
            {
                Producto producto = new Producto(siguienteClave++, nombre, cantidad, Math.Round(precio, 2));
                listaCompra.Agregar(producto);

                return Ok(new
                {
                    mensaje = $"Producto agregado con clave {producto.Clave}: {producto.Nombre}.",
                    estado = EstadoCompra()
                });
            }
        }

        // DELETE /api/listas/compra/{clave}  → eliminar por clave
        [HttpDelete("compra/{clave}")]
        public IActionResult EliminarProducto(string clave)
        {
            if (!int.TryParse(clave, out int numClave) || numClave < 1)
                return BadRequest(new { mensaje = "Clave: introducir sólo números enteros positivos." });

            lock (candadoCompra)
            {
                if (listaCompra.EstaVacia())
                    return BadRequest(new { mensaje = "La lista está vacía: no hay productos para eliminar." });

                Producto? eliminado = listaCompra.Eliminar(p => p.Clave == numClave);
                if (eliminado == null)
                    return NotFound(new { mensaje = $"No existe un producto con la clave {numClave}." });

                return Ok(new
                {
                    mensaje = $"Se eliminó el producto {eliminado.Clave}: {eliminado.Nombre}.",
                    estado = EstadoCompra()
                });
            }
        }

        // DELETE /api/listas/compra  → vaciar toda la lista
        [HttpDelete("compra")]
        public IActionResult VaciarCompra()
        {
            lock (candadoCompra)
            {
                listaCompra.Limpiar();
                siguienteClave = 1;
                return Ok(new { mensaje = "Se vació la lista de compra.", estado = EstadoCompra() });
            }
        }
    }
}
