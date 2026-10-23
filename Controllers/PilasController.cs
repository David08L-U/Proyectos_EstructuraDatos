using Microsoft.AspNetCore.Mvc;
using Proyectos_Estructuras.Models;

namespace Proyectos_Estructuras.Controllers
{
    // Rutas: /api/pilas/...
    [ApiController]
    [Route("api/[controller]")]
    public class PilasController : ControllerBase
    {
        // Prueba rápida: GET /api/pilas/estado
        [HttpGet("estado")]
        public IActionResult Estado()
        {
            return Ok(new { mensaje = "API de Pilas funcionando" });
        }

        // TODO Ejercicio 1: Invertir palabra
        // TODO Ejercicio 2: Palíndromo
        // TODO Ejercicio 3: Suma de números grandes
        // TODO Ejercicio 4: Reemplazar valor
    }
}
