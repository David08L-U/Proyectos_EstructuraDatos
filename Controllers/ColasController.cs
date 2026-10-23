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

        // TODO Ejercicio 1: Ventanilla de un banco
        // TODO Ejercicio 2: Juego pintar coches

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
