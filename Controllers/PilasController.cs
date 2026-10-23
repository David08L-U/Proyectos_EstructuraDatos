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

        // =====================================================================
        //  EJERCICIO 1: INVERTIR PALABRA
        //  Se mete cada letra a la pila (Push) y al sacarlas (Pop)
        //  salen en orden inverso: UTM → MTU
        // =====================================================================

        public class PalabraDto
        {
            public string? Palabra { get; set; }
        }

        // POST /api/pilas/invertir
        [HttpPost("invertir")]
        public IActionResult InvertirPalabra([FromBody] PalabraDto datos)
        {
            string palabra = (datos.Palabra ?? "").Trim();

            // ---- Validaciones ----
            if (palabra == "")
                return BadRequest(new { mensaje = "Hay datos faltantes: escribe una palabra." });

            if (palabra.Contains(' '))
                return BadRequest(new { mensaje = "Introduce sólo una palabra (sin espacios)." });

            if (palabra.Length > 30)
                return BadRequest(new { mensaje = "La palabra es muy larga: máximo 30 caracteres." });

            // ---- Proceso ----
            Pila<char> pila = new Pila<char>();

            // 1) Push: meter cada letra a la pila
            foreach (char letra in palabra)
                pila.Push(letra);

            // Guardamos cómo quedó la pila (del tope hacia abajo) para mostrarla
            List<char> pilaLlena = pila.ObtenerTodos();

            // 2) Pop: sacar letras hasta vaciar la pila
            string invertida = "";
            while (!pila.EstaVacia())
                invertida += pila.Pop();

            // ---- Salida ----
            return Ok(new
            {
                original = palabra,
                invertida,
                pila = pilaLlena.Select(c => c.ToString())   // tope primero
            });
        }

        // TODO Ejercicio 2: Palíndromo
        // TODO Ejercicio 3: Suma de números grandes
        // TODO Ejercicio 4: Reemplazar valor
    }
}
