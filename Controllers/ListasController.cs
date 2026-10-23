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

        // =====================================================================
        //  EJERCICIO 1: PRODUCTOS DISPONIBLES Y RETIRADOS (Víctor)
        //  - Almacena productos pasados por el escáner (clase Producto).
        //  - Cantidad y precio se generan aleatoriamente.
        //  - Nombre básico: producto1, producto2, etc.
        //  - Permite retirar elementos del almacén.
        //  - Muestra cantidad de disponibles y retirados con lista.
        // =====================================================================

        private static readonly Lista<Producto> disponiblesSuper = new Lista<Producto>();
        private static readonly Lista<Producto> retiradosSuper = new Lista<Producto>();
        private static int contadorSuper = 1;
        private static readonly object candadoSuper = new object();

        private static object EstadoSupermercado()
        {
            return new
            {
                disponibles = disponiblesSuper.ObtenerTodos(),
                retirados = retiradosSuper.ObtenerTodos(),
                totalDisponibles = disponiblesSuper.Contar(),
                totalRetirados = retiradosSuper.Contar()
            };
        }

        // GET /api/listas/supermercado
        [HttpGet("supermercado")]
        public IActionResult VerSupermercado()
        {
            lock (candadoSuper)
                return Ok(EstadoSupermercado());
        }

        public class EscanearDto
        {
            public int? Cantidad { get; set; }
        }

        // POST /api/listas/supermercado/escanear  → pasa uno o varios productos por el escáner
        [HttpPost("supermercado/escanear")]
        public IActionResult EscanearProducto([FromBody] EscanearDto? datos)
        {
            int veces = datos?.Cantidad ?? 1;
            if (veces < 1 || veces > 50)
                return BadRequest(new { mensaje = "La cantidad a escanear debe estar entre 1 y 50." });

            lock (candadoSuper)
            {
                List<Producto> nuevos = new List<Producto>();
                for (int i = 0; i < veces; i++)
                {
                    int clave = contadorSuper++;
                    string nombre = $"producto{clave}";
                    int cantidad = Random.Shared.Next(1, 15);
                    decimal precio = Math.Round((decimal)(Random.Shared.Next(5, 250) + Random.Shared.NextDouble()), 2);

                    Producto p = new Producto(clave, nombre, cantidad, precio);
                    disponiblesSuper.Agregar(p);
                    nuevos.Add(p);
                }

                string mensaje = veces == 1
                    ? $"Producto escaneado: {nuevos[0].Nombre} (${nuevos[0].Precio}, {nuevos[0].Cantidad} uds)."
                    : $"Se escanearon {veces} productos exitosamente.";

                return Ok(new
                {
                    mensaje,
                    nuevos,
                    estado = EstadoSupermercado()
                });
            }
        }

        // POST /api/listas/supermercado/retirar/{clave}  → retira un producto del almacén
        [HttpPost("supermercado/retirar/{clave}")]
        public IActionResult RetirarProductoSuper(string clave)
        {
            if (!int.TryParse(clave, out int numClave) || numClave < 1)
                return BadRequest(new { mensaje = "Clave: introducir sólo números enteros positivos." });

            lock (candadoSuper)
            {
                if (disponiblesSuper.EstaVacia())
                    return BadRequest(new { mensaje = "El almacén está vacío: no hay productos para retirar." });

                Producto? retirado = disponiblesSuper.Eliminar(p => p.Clave == numClave);
                if (retirado == null)
                    return NotFound(new { mensaje = $"No se encontró un producto disponible con la clave {numClave}." });

                retiradosSuper.Agregar(retirado);

                return Ok(new
                {
                    mensaje = $"Se retiró el producto {retirado.Nombre} (Clave {retirado.Clave}) del almacén.",
                    retirado,
                    estado = EstadoSupermercado()
                });
            }
        }

        // DELETE /api/listas/supermercado  → reinicia el almacén
        [HttpDelete("supermercado")]
        public IActionResult VaciarSupermercado()
        {
            lock (candadoSuper)
            {
                disponiblesSuper.Limpiar();
                retiradosSuper.Limpiar();
                contadorSuper = 1;
                return Ok(new { mensaje = "Se reinició el almacén del supermercado.", estado = EstadoSupermercado() });
            }
        }

        // =====================================================================
        //  EJERCICIO 2: PARES E IMPARES (Víctor)
        //  - Genera una lista de números aleatorios.
        //  - Muestra todos los pares en una lista y los impares en otra.
        // =====================================================================

        private static readonly Lista<int> listaNumerosAleatorios = new Lista<int>();
        private static readonly Lista<int> listaNumerosPares = new Lista<int>();
        private static readonly Lista<int> listaNumerosImpares = new Lista<int>();
        private static readonly object candadoParesImpares = new object();

        public class GenerarNumerosDto
        {
            public string? Cantidad { get; set; }
            public string? Min { get; set; }
            public string? Max { get; set; }
        }

        public class NumeroManualDto
        {
            public string? Numero { get; set; }
        }

        private static object EstadoParesImpares()
        {
            return new
            {
                todos = listaNumerosAleatorios.ObtenerTodos(),
                pares = listaNumerosPares.ObtenerTodos(),
                impares = listaNumerosImpares.ObtenerTodos(),
                totalTodos = listaNumerosAleatorios.Contar(),
                totalPares = listaNumerosPares.Contar(),
                totalImpares = listaNumerosImpares.Contar()
            };
        }

        // GET /api/listas/pareseimpares
        [HttpGet("pareseimpares")]
        public IActionResult VerParesImpares()
        {
            lock (candadoParesImpares)
                return Ok(EstadoParesImpares());
        }

        // POST /api/listas/pareseimpares/generar  → genera números y los clasifica
        [HttpPost("pareseimpares/generar")]
        public IActionResult GenerarParesImpares([FromBody] GenerarNumerosDto? datos)
        {
            string textoCantidad = (datos?.Cantidad ?? "15").Trim();
            string textoMin = (datos?.Min ?? "1").Trim();
            string textoMax = (datos?.Max ?? "100").Trim();

            if (!int.TryParse(textoCantidad, out int cantidad))
                return BadRequest(new { mensaje = "Cantidad: introducir sólo números enteros." });

            if (cantidad < 1 || cantidad > 200)
                return BadRequest(new { mensaje = "La cantidad debe ser entre 1 y 200." });

            if (!int.TryParse(textoMin, out int min) || !int.TryParse(textoMax, out int max))
                return BadRequest(new { mensaje = "Rango mínimo y máximo: introducir sólo números enteros." });

            if (min > max)
                return BadRequest(new { mensaje = "El valor mínimo no puede ser mayor que el máximo." });

            lock (candadoParesImpares)
            {
                listaNumerosAleatorios.Limpiar();
                listaNumerosPares.Limpiar();
                listaNumerosImpares.Limpiar();

                for (int i = 0; i < cantidad; i++)
                {
                    int n = Random.Shared.Next(min, max + 1);
                    listaNumerosAleatorios.Agregar(n);

                    if (n % 2 == 0)
                        listaNumerosPares.Agregar(n);
                    else
                        listaNumerosImpares.Agregar(n);
                }

                return Ok(new
                {
                    mensaje = $"Se generaron {cantidad} números aleatorios (Pares: {listaNumerosPares.Contar()}, Impares: {listaNumerosImpares.Contar()}).",
                    estado = EstadoParesImpares()
                });
            }
        }

        // POST /api/listas/pareseimpares/agregar  → agrega un número individual
        [HttpPost("pareseimpares/agregar")]
        public IActionResult AgregarNumeroIndividual([FromBody] NumeroManualDto datos)
        {
            string textoNum = (datos.Numero ?? "").Trim();
            if (string.IsNullOrWhiteSpace(textoNum))
                return BadRequest(new { mensaje = "Hay datos faltantes: ingresa un número." });

            if (!int.TryParse(textoNum, out int num))
                return BadRequest(new { mensaje = "Introducir sólo números enteros." });

            lock (candadoParesImpares)
            {
                listaNumerosAleatorios.Agregar(num);
                if (num % 2 == 0)
                    listaNumerosPares.Agregar(num);
                else
                    listaNumerosImpares.Agregar(num);

                string tipo = num % 2 == 0 ? "par" : "impar";
                return Ok(new
                {
                    mensaje = $"Número {num} agregado a la lista y clasificado como {tipo}.",
                    estado = EstadoParesImpares()
                });
            }
        }

        // DELETE /api/listas/pareseimpares  → vaciar listas
        [HttpDelete("pareseimpares")]
        public IActionResult VaciarParesImpares()
        {
            lock (candadoParesImpares)
            {
                listaNumerosAleatorios.Limpiar();
                listaNumerosPares.Limpiar();
                listaNumerosImpares.Limpiar();
                return Ok(new { mensaje = "Se vaciaron todas las listas.", estado = EstadoParesImpares() });
            }
        }

        // =====================================================================
        //  EJERCICIO 3: APROBADOS Y REPROBADOS (Víctor)
        //  - Almacena alumnos con nombre y calificación en una lista.
        //  - Saca a los alumnos reprobados (< 7) y los pasa a lista de reprobados.
        //  - Muestra la lista de aprobados y la de reprobados.
        // =====================================================================

        private static readonly Lista<Alumno> listaAprobados = new Lista<Alumno>();
        private static readonly Lista<Alumno> listaReprobados = new Lista<Alumno>();
        private static int contadorAlumnos = 1;
        private static readonly object candadoAlumnos = new object();

        public class AlumnoDto
        {
            public string? Nombre { get; set; }
            public string? Calificacion { get; set; }
        }

        private static object EstadoAlumnos()
        {
            var aprob = listaAprobados.ObtenerTodos();
            var reprob = listaReprobados.ObtenerTodos();
            int total = aprob.Count + reprob.Count;
            decimal promedio = total > 0
                ? Math.Round((aprob.Sum(a => a.Calificacion) + reprob.Sum(a => a.Calificacion)) / total, 2)
                : 0.0m;

            return new
            {
                aprobados = aprob,
                reprobados = reprob,
                totalAprobados = aprob.Count,
                totalReprobados = reprob.Count,
                totalAlumnos = total,
                promedioGeneral = promedio
            };
        }

        // GET /api/listas/alumnos
        [HttpGet("alumnos")]
        public IActionResult VerAlumnos()
        {
            lock (candadoAlumnos)
                return Ok(EstadoAlumnos());
        }

        // POST /api/listas/alumnos  → captura alumno y clasifica según calificación
        [HttpPost("alumnos")]
        public IActionResult CapturarAlumno([FromBody] AlumnoDto datos)
        {
            string nombre = (datos.Nombre ?? "").Trim();
            string textoCalif = (datos.Calificacion ?? "").Trim().Replace(',', '.');

            // Validaciones
            if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(textoCalif))
                return BadRequest(new { mensaje = "Hay datos faltantes: ingresa el nombre y la calificación." });

            if (!Regex.IsMatch(nombre, @"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{2,50}$"))
                return BadRequest(new { mensaje = "Nombre de alumno: introduce sólo letras (mínimo 2 caracteres)." });

            if (!decimal.TryParse(textoCalif, NumberStyles.Number, CultureInfo.InvariantCulture, out decimal calificacion))
                return BadRequest(new { mensaje = "Calificación: introducir sólo números (ej. 8.5)." });

            if (calificacion < 0 || calificacion > 10)
                return BadRequest(new { mensaje = "La calificación debe estar en una escala del 0 al 10." });

            calificacion = Math.Round(calificacion, 2);

            lock (candadoAlumnos)
            {
                Alumno alumno = new Alumno(contadorAlumnos++, nombre, calificacion);

                if (alumno.Calificacion < 7.0m)
                {
                    listaReprobados.Agregar(alumno);
                    return Ok(new
                    {
                        mensaje = $"Alumno {alumno.Nombre} clasificado como REPROBADO (Calificación: {alumno.Calificacion}).",
                        alumno,
                        estado = EstadoAlumnos()
                    });
                }
                else
                {
                    listaAprobados.Agregar(alumno);
                    return Ok(new
                    {
                        mensaje = $"Alumno {alumno.Nombre} clasificado como APROBADO (Calificación: {alumno.Calificacion}).",
                        alumno,
                        estado = EstadoAlumnos()
                    });
                }
            }
        }

        // POST /api/listas/alumnos/demo  → carga un grupo de alumnos de ejemplo
        [HttpPost("alumnos/demo")]
        public IActionResult CargarAlumnosDemo()
        {
            lock (candadoAlumnos)
            {
                var ejemplos = new (string Nombre, decimal Calificacion)[]
                {
                    ("Sofía Méndez", 9.5m),
                    ("Carlos Pech", 5.8m),
                    ("Andrea Torres", 8.0m),
                    ("Rodrigo Canul", 6.2m),
                    ("Mariana López", 10.0m),
                    ("Javier Morales", 4.5m)
                };

                foreach (var ej in ejemplos)
                {
                    Alumno a = new Alumno(contadorAlumnos++, ej.Nombre, ej.Calificacion);
                    if (a.Calificacion < 7.0m)
                        listaReprobados.Agregar(a);
                    else
                        listaAprobados.Agregar(a);
                }

                return Ok(new
                {
                    mensaje = "Se cargaron 6 alumnos de ejemplo.",
                    estado = EstadoAlumnos()
                });
            }
        }

        // DELETE /api/listas/alumnos/{id}  → eliminar alumno
        [HttpDelete("alumnos/{id}")]
        public IActionResult EliminarAlumno(string id)
        {
            if (!int.TryParse(id, out int numId) || numId < 1)
                return BadRequest(new { mensaje = "ID: introducir sólo números enteros positivos." });

            lock (candadoAlumnos)
            {
                Alumno? eliminado = listaAprobados.Eliminar(a => a.Id == numId) ?? listaReprobados.Eliminar(a => a.Id == numId);
                if (eliminado == null)
                    return NotFound(new { mensaje = $"No se encontró al alumno con ID {numId}." });

                return Ok(new
                {
                    mensaje = $"Se eliminó al alumno {eliminado.Nombre}.",
                    estado = EstadoAlumnos()
                });
            }
        }

        // DELETE /api/listas/alumnos  → vaciar listas
        [HttpDelete("alumnos")]
        public IActionResult VaciarAlumnos()
        {
            lock (candadoAlumnos)
            {
                listaAprobados.Limpiar();
                listaReprobados.Limpiar();
                contadorAlumnos = 1;
                return Ok(new { mensaje = "Se vaciaron las listas de alumnos.", estado = EstadoAlumnos() });
            }
        }

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
