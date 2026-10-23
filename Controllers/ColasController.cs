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
        // TODO Ejercicio 3: Estacionamiento para autos
    }
}
