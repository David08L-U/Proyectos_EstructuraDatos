using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Proyectos_Estructuras.Models;

namespace Proyectos_Estructuras.Controllers
{
    // Rutas: /api/colas/...
    [ApiController]
    [Route("api/[controller]")]
    public class ColasController : ControllerBase
    {
        // "static" para que los datos NO se borren entre cada petición
        private static readonly Cola<Cliente> colaBanco = new Cola<Cliente>(10);
        private static readonly ColaCircularDoble<Auto> estacionamiento = new ColaCircularDoble<Auto>();
        private static int siguienteTurnoBanco = 1;

        // Candado para que dos peticiones no modifiquen la cola al mismo tiempo
        private static readonly object candado = new object();

        // Prueba rápida: GET /api/colas/estado
        [HttpGet("estado")]
        public IActionResult Estado()
        {
            return Ok(new
            {
                mensaje = "API de Colas funcionando",
                clientesEnBanco = colaBanco.Contar(),
                autosEstacionados = estacionamiento.Contar()
            });
        }

        public class NuevoClienteDto
        {
            public string? Nombre { get; set; }
            public string? Movimiento { get; set; }
        }

        // GET /api/colas/banco
        [HttpGet("banco")]
        public IActionResult ObtenerColaBanco()
        {
            lock (candado)
            {
                return Ok(new
                {
                    clientes = colaBanco.ObtenerTodos(),
                    total = colaBanco.Contar(),
                    capacidad = colaBanco.Capacidad,
                    colaVacia = colaBanco.ColaVacia(),
                    colaLlena = colaBanco.ColaLlena()
                });
            }
        }

        // POST /api/colas/banco/agregar
        [HttpPost("banco/agregar")]
        public IActionResult AgregarCliente([FromBody] NuevoClienteDto datos)
        {
            string nombre = datos.Nombre?.Trim() ?? "";
            string movimiento = datos.Movimiento?.Trim() ?? "";

            if (nombre.Length == 0)
                return BadRequest(new { mensaje = "Escribe el nombre del cliente." });

            if (nombre.Length > 60)
                return BadRequest(new { mensaje = "El nombre no puede superar 60 caracteres." });

            if (movimiento.Length == 0)
                return BadRequest(new { mensaje = "Selecciona un tipo de movimiento." });

            if (movimiento.Length > 60)
                return BadRequest(new { mensaje = "El tipo de movimiento no puede superar 60 caracteres." });

            lock (candado)
            {
                if (colaBanco.ColaLlena())
                    return Conflict(new { mensaje = $"La cola está llena. El banco tiene un cupo máximo de {colaBanco.Capacidad} clientes." });

                Cliente cliente = new Cliente(siguienteTurnoBanco++, nombre, movimiento);
                colaBanco.InsertaCola(cliente);

                return Ok(new
                {
                    mensaje = $"Cliente agregado a la cola con el turno {cliente.Turno}.",
                    cliente,
                    total = colaBanco.Contar(),
                    capacidad = colaBanco.Capacidad
                });
            }
        }

        // POST /api/colas/banco/atender
        [HttpPost("banco/atender")]
        public IActionResult AtenderClienteBanco()
        {
            lock (candado)
            {
                if (colaBanco.ColaVacia())
                    return BadRequest(new { mensaje = "No hay clientes en espera. La cola está vacía." });

                DateTime horaAtencion = DateTime.Now;
                Cliente cliente = colaBanco.EliminaCola();
                double tiempoEsperaSegundos = Math.Max(0, (horaAtencion - cliente.HoraLlegada).TotalSeconds);

                return Ok(new
                {
                    mensaje = $"Turno {cliente.Turno}: {cliente.Nombre} fue atendido.",
                    cliente,
                    horaAtencion,
                    tiempoEsperaSegundos,
                    total = colaBanco.Contar(),
                    capacidad = colaBanco.Capacidad
                });
            }
        }

        // =====================================================================
        //  EJERCICIO 2: JUEGO PINTAR COCHES (Víctor)
        //  - Cola de atención donde se atienden y pintan coches (máximo 5).
        //  - Solo se puede pintar el primer carro respetando la cola (FIFO).
        //  - Cada determinado tiempo se enfila un carro (inicia en 20s).
        //  - La velocidad de enfilamiento aumenta conforme el usuario pinta 3 carros.
        //  - Los colores requeridos se generan aleatoriamente de la paleta.
        //  - El juego termina cuando hay 5 carros enfilados.
        //  - Muestra el récord obtenido (carros pintados y tiempo total).
        // =====================================================================

        private static readonly (string Nombre, string Hex)[] COLORES_PALETA = new[]
        {
            ("Amarillo", "#EAB308"),
            ("Crema", "#FEF08A"),
            ("Verde oliva", "#65A30D"),
            ("Naranja", "#F97316"),
            ("Azul oscuro", "#1E3A8A"),
            ("Verde", "#16A34A"),
            ("Rojo", "#DC2626"),
            ("Guinda", "#881337"),
            ("Café", "#78350F")
        };

        private static readonly Cola<CarroJuego> colaCarrosJuego = new Cola<CarroJuego>(5);
        private static readonly Lista<RecordJuego> recordsJuego = new Lista<RecordJuego>();
        private static int siguienteIdCarro = 1;
        private static int carrosPintadosPartida = 0;
        private static DateTime? inicioPartida = null;
        private static bool juegoTerminado = false;
        private static CarroJuego? ultimoCarroAtendido = new CarroJuego(0, "Amarillo", "#EAB308") { Pintado = true, ColorPintado = "Amarillo" };
        private static readonly object candadoJuego = new object();

        public class PintarColorDto
        {
            public string? Color { get; set; }
        }

        public class GuardarRecordDto
        {
            public string? Jugador { get; set; }
        }

        private static int CalcularIntervaloLlegadaSegundos(int pintados)
        {
            // Inicia en 20s, y por cada 3 carros pintados se acelera 2s (mínimo 5s)
            int reduccion = (pintados / 3) * 2;
            int intervalo = 20 - reduccion;
            return Math.Max(5, intervalo);
        }

        private static void AsegurarInicializacionDemo()
        {
            if (inicioPartida == null)
            {
                inicioPartida = DateTime.Now;
                siguienteIdCarro = 1;
                carrosPintadosPartida = 0;
                juegoTerminado = false;
                ultimoCarroAtendido = new CarroJuego(0, "Amarillo", "#EAB308") { Pintado = true, ColorPintado = "Amarillo" };

                // Cargar los carros tal como se ilustran en el PDF (Naranja, Rojo, Verde)
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Naranja", "#F97316"));
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Rojo", "#DC2626"));
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Verde", "#16A34A"));
            }
        }

        private static object EstadoJuego()
        {
            AsegurarInicializacionDemo();

            int tiempoSegundos = inicioPartida.HasValue
                ? (int)Math.Max(0, (DateTime.Now - inicioPartida.Value).TotalSeconds)
                : 0;

            return new
            {
                carros = colaCarrosJuego.ObtenerTodos(),
                total = colaCarrosJuego.Contar(),
                capacidad = colaCarrosJuego.Capacidad,
                estaLlena = colaCarrosJuego.ColaLlena(),
                estaVacia = colaCarrosJuego.ColaVacia(),
                frente = colaCarrosJuego.VerFrente(),
                final = colaCarrosJuego.VerFinal(),
                ultimoAtendido = ultimoCarroAtendido,
                carrosPintados = carrosPintadosPartida,
                juegoTerminado,
                tiempoTotalSegundos = tiempoSegundos,
                intervaloLlegada = CalcularIntervaloLlegadaSegundos(carrosPintadosPartida),
                paleta = COLORES_PALETA.Select(c => new { nombre = c.Nombre, hex = c.Hex }),
                records = recordsJuego.ObtenerTodos()
                                      .OrderByDescending(r => r.CarrosPintados)
                                      .ThenBy(r => r.TiempoTotalSegundos)
                                      .Take(5)
            };
        }

        // GET /api/colas/juego/estado  → estado actual del juego
        [HttpGet("juego/estado")]
        public IActionResult VerEstadoJuego()
        {
            lock (candadoJuego)
                return Ok(EstadoJuego());
        }

        // POST /api/colas/juego/iniciar  → comienza una nueva partida
        [HttpPost("juego/iniciar")]
        public IActionResult IniciarJuego([FromQuery] bool reiniciar = true)
        {
            lock (candadoJuego)
            {
                // Vaciar la cola existente usando la operación EliminaCola
                while (!colaCarrosJuego.ColaVacia())
                    colaCarrosJuego.EliminaCola();

                siguienteIdCarro = 1;
                carrosPintadosPartida = 0;
                inicioPartida = DateTime.Now;
                juegoTerminado = false;

                // Carro Atendido de muestra (Amarillo como en el diagrama del PDF)
                ultimoCarroAtendido = new CarroJuego(0, "Amarillo", "#EAB308") { Pintado = true, ColorPintado = "Amarillo" };

                // Insertar los 3 carros del ejemplo del PDF (Naranja, Rojo, Verde)
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Naranja", "#F97316"));
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Rojo", "#DC2626"));
                colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, "Verde", "#16A34A"));

                return Ok(new
                {
                    mensaje = "¡Partida iniciada! Se cargaron los coches del ejemplo del PDF (Naranja, Rojo, Verde).",
                    estado = EstadoJuego()
                });
            }
        }

        // POST /api/colas/juego/enfilaSiguiente  → enfila un nuevo carro automáticamente
        [HttpPost("juego/enfilaSiguiente")]
        public IActionResult EnfilaSiguienteCarro()
        {
            lock (candadoJuego)
            {
                if (juegoTerminado)
                    return BadRequest(new { mensaje = "El juego ya ha terminado.", estado = EstadoJuego(), finDelJuego = true });

                if (colaCarrosJuego.ColaLlena())
                {
                    juegoTerminado = true;
                    return Ok(new
                    {
                        mensaje = "¡Fin del juego! La cola llegó a su límite de 5 carros sin atender.",
                        finDelJuego = true,
                        estado = EstadoJuego()
                    });
                }

                var colorAleatorio = COLORES_PALETA[Random.Shared.Next(COLORES_PALETA.Length)];
                CarroJuego nuevoCarro = new CarroJuego(siguienteIdCarro++, colorAleatorio.Nombre, colorAleatorio.Hex);

                try
                {
                    colaCarrosJuego.InsertaCola(nuevoCarro);
                }
                catch (InvalidOperationException)
                {
                    juegoTerminado = true;
                }

                // Si al insertar llegó a 5 carros, se termina el juego según regla #4
                if (colaCarrosJuego.ColaLlena())
                    juegoTerminado = true;

                return Ok(new
                {
                    mensaje = juegoTerminado
                        ? "¡Fin del juego! La cola de atención llegó a 5 carros."
                        : $"Nuevo carro enfilado (#{nuevoCarro.Id} - {nuevoCarro.ColorObjetivo}).",
                    finDelJuego = juegoTerminado,
                    estado = EstadoJuego()
                });
            }
        }

        // POST /api/colas/juego/pintar  → atiende el primer carro con el color seleccionado
        [HttpPost("juego/pintar")]
        public IActionResult PintarPrimerCarro([FromBody] PintarColorDto datos)
        {
            string colorElegido = (datos.Color ?? "").Trim();
            if (string.IsNullOrWhiteSpace(colorElegido))
                return BadRequest(new { mensaje = "Selecciona un color de la paleta." });

            lock (candadoJuego)
            {
                if (juegoTerminado)
                    return BadRequest(new { mensaje = "La partida ha terminado. Inicia un nuevo juego." });

                if (colaCarrosJuego.ColaVacia())
                    return BadRequest(new { mensaje = "No hay ningún carro en la cola de atención." });

                // Regla #2: Sólo se puede pintar el primer carro respetando la cola (VerFrente)
                CarroJuego frente = colaCarrosJuego.VerFrente()!;

                if (!string.Equals(frente.ColorObjetivo, colorElegido, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        mensaje = $"¡Color incorrecto! El carro #{frente.Id} pide '{frente.ColorObjetivo}', pero elegiste '{colorElegido}'.",
                        acierto = false,
                        estado = EstadoJuego()
                    });
                }

                // Color correcto: se retira de la cola con EliminaCola (FIFO)
                CarroJuego atendido = colaCarrosJuego.EliminaCola();
                atendido.Pintado = true;
                atendido.ColorPintado = colorElegido;
                ultimoCarroAtendido = atendido;
                carrosPintadosPartida++;

                // Si la cola se quedó vacía, encolar el siguiente carro para mantener el flujo
                if (colaCarrosJuego.ColaVacia())
                {
                    var sigColor = COLORES_PALETA[Random.Shared.Next(COLORES_PALETA.Length)];
                    colaCarrosJuego.InsertaCola(new CarroJuego(siguienteIdCarro++, sigColor.Nombre, sigColor.Hex));
                }

                string avisoVelocidad = "";
                if (carrosPintadosPartida % 3 == 0)
                {
                    int nuevoIntervalo = CalcularIntervaloLlegadaSegundos(carrosPintadosPartida);
                    avisoVelocidad = $" ¡La velocidad aumentó! Ahora los carros llegan cada {nuevoIntervalo}s.";
                }

                return Ok(new
                {
                    mensaje = $"¡Carro #{atendido.Id} pintado con éxito de {colorElegido}!{avisoVelocidad}",
                    acierto = true,
                    atendido,
                    estado = EstadoJuego()
                });
            }
        }

        // POST /api/colas/juego/guardarRecord  → guarda el récord obtenido
        [HttpPost("juego/guardarRecord")]
        public IActionResult GuardarRecord([FromBody] GuardarRecordDto datos)
        {
            string jugador = (datos.Jugador ?? "Víctor").Trim();
            if (string.IsNullOrWhiteSpace(jugador))
                jugador = "Jugador";

            lock (candadoJuego)
            {
                int tiempo = inicioPartida.HasValue
                    ? (int)Math.Max(1, (DateTime.Now - inicioPartida.Value).TotalSeconds)
                    : 0;

                RecordJuego rec = new RecordJuego
                {
                    Jugador = jugador.Length > 30 ? jugador.Substring(0, 30) : jugador,
                    CarrosPintados = carrosPintadosPartida,
                    TiempoTotalSegundos = tiempo,
                    Fecha = DateTime.Now
                };

                recordsJuego.Agregar(rec);

                return Ok(new
                {
                    mensaje = $"Récord guardado: {rec.CarrosPintados} carros en {rec.TiempoTotalSegundos} segundos.",
                    record = rec,
                    records = recordsJuego.ObtenerTodos()
                                          .OrderByDescending(r => r.CarrosPintados)
                                          .ThenBy(r => r.TiempoTotalSegundos)
                                          .Take(5)
                });
            }
        }


        // =====================================================================
        //  EJERCICIO 3: ESTACIONAMIENTO PARA AUTOS
        //  Cola Circular Doblemente Ligada · Se cobra $2.00 por segundo
        // =====================================================================

        private const decimal TARIFA_POR_SEGUNDO = 2.00m;

        // Datos que manda el frontend al registrar una entrada
        public class EntradaAutoDto
        {
            public string? Placas { get; set; }
            public string? Propietario { get; set; }
        }

        // GET /api/colas/estacionamiento  → muestra la estructura completa
        [HttpGet("estacionamiento")]
        public IActionResult VerEstacionamiento()
        {
            lock (candado)
            {
                return Ok(new
                {
                    autos = estacionamiento.ObtenerTodos(),
                    total = estacionamiento.Contar(),
                    frente = estacionamiento.VerFrente(),
                    final = estacionamiento.VerFinal(),
                    tarifa = TARIFA_POR_SEGUNDO
                });
            }
        }

        // POST /api/colas/estacionamiento/entrada  → 1. Entrada de Auto
        [HttpPost("estacionamiento/entrada")]
        public IActionResult EntradaAuto([FromBody] EntradaAutoDto datos)
        {
            // ---- Validaciones ----
            string placas = (datos.Placas ?? "").Trim().ToUpper();
            string propietario = (datos.Propietario ?? "").Trim();

            if (placas == "" || propietario == "")
                return BadRequest(new { mensaje = "Hay datos faltantes: captura las placas y el propietario." });

            if (!Regex.IsMatch(placas, @"^[A-Z0-9-]{5,10}$"))
                return BadRequest(new { mensaje = "Placas no válidas: usa de 5 a 10 caracteres (letras, números o guion)." });

            if (!Regex.IsMatch(propietario, @"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]{3,60}$"))
                return BadRequest(new { mensaje = "Propietario no válido: introduce sólo letras (mínimo 3)." });

            lock (candado)
            {
                // No se permiten dos autos con las mismas placas dentro
                bool repetido = estacionamiento.ObtenerTodos().Any(a => a.Placas == placas);
                if (repetido)
                    return BadRequest(new { mensaje = $"El auto con placas {placas} ya está dentro del estacionamiento." });

                // Hora de entrada tomada del sistema (DateTime.Now dentro del constructor)
                Auto auto = new Auto(placas, propietario);
                estacionamiento.Insertar(auto);

                return Ok(new
                {
                    mensaje = $"Entrada registrada: {placas} de {propietario} a las {auto.HoraEntrada:HH:mm:ss}.",
                    auto
                });
            }
        }

        // POST /api/colas/estacionamiento/salida  → 2. Salida de Autos
        [HttpPost("estacionamiento/salida")]
        public IActionResult SalidaAuto()
        {
            lock (candado)
            {
                // Validar que el estacionamiento no esté vacío
                if (estacionamiento.EstaVacia())
                    return BadRequest(new { mensaje = "El estacionamiento está vacío: no hay autos para sacar." });

                // Sale el auto que está al frente (FIFO)
                Auto auto = estacionamiento.Eliminar();
                DateTime horaSalida = DateTime.Now;

                // Segundos estacionado (se cobra el segundo iniciado, mínimo 1)
                int segundos = (int)Math.Ceiling((horaSalida - auto.HoraEntrada).TotalSeconds);
                if (segundos < 1) segundos = 1;

                decimal costo = segundos * TARIFA_POR_SEGUNDO;

                return Ok(new
                {
                    placas = auto.Placas,
                    propietario = auto.Propietario,
                    horaEntrada = auto.HoraEntrada,
                    horaSalida,
                    segundos,
                    tarifa = TARIFA_POR_SEGUNDO,
                    costo
                });
            }
        }
    }
}
