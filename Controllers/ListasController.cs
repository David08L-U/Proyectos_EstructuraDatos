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
        // TODO Ejercicio 4: Eliminar y ordenar productos
        // TODO Ejercicio 5: Listar palabras por letra
    }
}
