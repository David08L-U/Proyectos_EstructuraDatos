using Microsoft.AspNetCore.Mvc;
using Proyectos_Estructuras.Models;
using System.Text;

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

        public class PalabraPalindromoDto
        {
            public string? Palabra { get; set; }
        }

        public class SumaNumerosDto
        {
            public string? Numero1 { get; set; }
            public string? Numero2 { get; set; }
        }

        public class ReemplazarValorDto
        {
            public List<int>? Valores { get; set; }
            public int? Viejo { get; set; }
            public int? Nuevo { get; set; }
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

        // POST/api/pilas/palindromo
        [HttpPost("palindromo")]
        public IActionResult VerificarPalindromo([FromBody] PalabraPalindromoDto datos)
        {
            string? entrada = datos.Palabra;

            if (entrada == null)
                return BadRequest(new { mensaje = "Hay datos faltantes: escribe una palabra." });

            if (entrada.Length == 0)
                return BadRequest(new { mensaje = "La palabra no puede estar vacía." });

            if (string.IsNullOrWhiteSpace(entrada))
                return BadRequest(new { mensaje = "La entrada contiene solo espacios." });

            if (entrada.Any(char.IsWhiteSpace))
                return BadRequest(new { mensaje = "Introduce sólo una palabra (sin espacios)." });

            if (entrada.Any(caracter => !char.IsLetter(caracter)))
                return BadRequest(new { mensaje = "La palabra solo puede contener letras." });

            Pila<char> pila = new Pila<char>();
            foreach (char caracter in entrada)
                pila.Push(caracter);

            List<char> pilaLlena = pila.ObtenerTodos();
            StringBuilder invertidaBuilder = new StringBuilder(entrada.Length);
            while (!pila.EstaVacia())
                invertidaBuilder.Append(pila.Pop());
            string invertida = invertidaBuilder.ToString();

            bool esPalindromo = string.Equals(
                entrada,
                invertida,
                StringComparison.OrdinalIgnoreCase);

            return Ok(new
            {
                original = entrada,
                invertida,
                esPalindromo,
                pila = pilaLlena.Select(caracter => caracter.ToString())
            });
        }

        // POST /api/pilas/sumar-numeros
        [HttpPost("sumar-numeros")]
        public IActionResult SumarNumerosGrandes([FromBody] SumaNumerosDto datos)
        {
            string entradaNumero1 = datos.Numero1?.Trim() ?? "";
            string entradaNumero2 = datos.Numero2?.Trim() ?? "";

            if (entradaNumero1.Length == 0)
                return BadRequest(new { mensaje = "El primer número es obligatorio." });

            if (entradaNumero2.Length == 0)
                return BadRequest(new { mensaje = "El segundo número es obligatorio." });

            if (!TryNormalizarEntero(entradaNumero1, out string numero1, out bool negativo1))
                return BadRequest(new { mensaje = "El primer valor no es un entero válido. Usa solo dígitos y un signo opcional al inicio." });

            if (!TryNormalizarEntero(entradaNumero2, out string numero2, out bool negativo2))
                return BadRequest(new { mensaje = "El segundo valor no es un entero válido. Usa solo dígitos y un signo opcional al inicio." });

            Pila<int> pilaNumero1 = CrearPilaDigitos(numero1);
            Pila<int> pilaNumero2 = CrearPilaDigitos(numero2);
            List<int> digitosNumero1 = pilaNumero1.ObtenerTodos();
            List<int> digitosNumero2 = pilaNumero2.ObtenerTodos();
            Pila<int> pilaResultado = new Pila<int>();
            bool resultadoNegativo;

            if (negativo1 == negativo2)
            {
                int acarreo = 0;
                while (!pilaNumero1.EstaVacia() || !pilaNumero2.EstaVacia() || acarreo > 0)
                {
                    int digito1 = pilaNumero1.EstaVacia() ? 0 : pilaNumero1.Pop();
                    int digito2 = pilaNumero2.EstaVacia() ? 0 : pilaNumero2.Pop();
                    int sumaColumna = digito1 + digito2 + acarreo;

                    pilaResultado.Push(sumaColumna % 10);
                    acarreo = sumaColumna / 10;
                }

                resultadoNegativo = negativo1;
            }
            else
            {
                int comparacion = CompararMagnitudes(numero1, numero2);
                if (comparacion == 0)
                {
                    pilaResultado.Push(0);
                    resultadoNegativo = false;
                }
                else
                {
                    Pila<int> pilaMayor = comparacion > 0 ? pilaNumero1 : pilaNumero2;
                    Pila<int> pilaMenor = comparacion > 0 ? pilaNumero2 : pilaNumero1;
                    resultadoNegativo = comparacion > 0 ? negativo1 : negativo2;
                    int prestamo = 0;

                    while (!pilaMayor.EstaVacia() || !pilaMenor.EstaVacia())
                    {
                        int digitoMayor = pilaMayor.EstaVacia() ? 0 : pilaMayor.Pop();
                        int digitoMenor = pilaMenor.EstaVacia() ? 0 : pilaMenor.Pop();
                        int diferencia = digitoMayor - digitoMenor - prestamo;

                        if (diferencia < 0)
                        {
                            diferencia += 10;
                            prestamo = 1;
                        }
                        else
                        {
                            prestamo = 0;
                        }

                        pilaResultado.Push(diferencia);
                    }

                    while (pilaResultado.Contar() > 1 && pilaResultado.Peek() == 0)
                        pilaResultado.Pop();
                }
            }

            List<int> digitosResultado = pilaResultado.ObtenerTodos();
            StringBuilder resultadoBuilder = new StringBuilder(digitosResultado.Count);
            while (!pilaResultado.EstaVacia())
                resultadoBuilder.Append(pilaResultado.Pop());
            string resultado = resultadoBuilder.ToString();

            if (resultadoNegativo && resultado != "0")
                resultado = "-" + resultado;

            return Ok(new
            {
                numero1 = entradaNumero1,
                numero2 = entradaNumero2,
                suma = resultado,
                pilaNumero1 = digitosNumero1,
                pilaNumero2 = digitosNumero2,
                pilaResultado = digitosResultado
            });
        }

        private static bool TryNormalizarEntero(string entrada, out string magnitud, out bool negativo)
        {
            string valor = entrada.Trim();
            int inicioDigitos = 0;
            negativo = false;

            if (valor[0] == '-' || valor[0] == '+')
            {
                negativo = valor[0] == '-';
                inicioDigitos = 1;
            }

            if (inicioDigitos == valor.Length)
            {
                magnitud = "";
                return false;
            }

            for (int indice = inicioDigitos; indice < valor.Length; indice++)
            {
                if (valor[indice] < '0' || valor[indice] > '9')
                {
                    magnitud = "";
                    return false;
                }
            }

            magnitud = valor.Substring(inicioDigitos).TrimStart('0');
            if (magnitud.Length == 0)
                magnitud = "0";

            if (magnitud == "0")
                negativo = false;

            return true;
        }

        private static Pila<int> CrearPilaDigitos(string numero)
        {
            Pila<int> pila = new Pila<int>();
            foreach (char digito in numero)
                pila.Push(digito - '0');
            return pila;
        }

        private static int CompararMagnitudes(string numero1, string numero2)
        {
            if (numero1.Length != numero2.Length)
                return numero1.Length.CompareTo(numero2.Length);

            return string.CompareOrdinal(numero1, numero2);
        }

        // POST /api/pilas/reemplazar
        [HttpPost("reemplazar")]
        public IActionResult ReemplazarValorEnPila([FromBody] ReemplazarValorDto datos)
        {
            if (datos.Valores == null)
                return BadRequest(new { mensaje = "Debes proporcionar la lista de valores de la pila." });

            if (!datos.Viejo.HasValue)
                return BadRequest(new { mensaje = "Debes proporcionar el valor que deseas reemplazar." });

            if (!datos.Nuevo.HasValue)
                return BadRequest(new { mensaje = "Debes proporcionar el nuevo valor." });

            Pila<int> pila = new Pila<int>();
            foreach (int valor in datos.Valores)
                pila.Push(valor);

            List<int> pilaOriginal = pila.ObtenerTodos();
            int reemplazos = ReemplazarValor(pila, datos.Viejo.Value, datos.Nuevo.Value);

            return Ok(new
            {
                pilaOriginal,
                pilaResultado = pila.ObtenerTodos(),
                viejo = datos.Viejo.Value,
                nuevo = datos.Nuevo.Value,
                encontrado = reemplazos > 0,
                reemplazos
            });
        }

        private static int ReemplazarValor(Pila<int> pila, int viejo, int nuevo)
        {
            if (pila == null)
                throw new ArgumentNullException(nameof(pila));

            Pila<int> auxiliar = new Pila<int>();
            int reemplazos = 0;

            while (!pila.EstaVacia())
            {
                int valor = pila.Pop();
                if (valor == viejo)
                {
                    valor = nuevo;
                    reemplazos++;
                }

                auxiliar.Push(valor);
            }

            while (!auxiliar.EstaVacia())
                pila.Push(auxiliar.Pop());

            return reemplazos;
        }
    }
}
