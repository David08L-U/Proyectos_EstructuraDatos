namespace Proyectos_Estructuras.Models
{
    // Grupo de palabras que empiezan con la misma letra (Listas: ejercicio 5).
    // Cada grupo tiene su PROPIA lista de palabras.
    public class GrupoLetra
    {
        public char Letra { get; set; }
        public Lista<string> Palabras { get; } = new Lista<string>();

        public GrupoLetra(char letra)
        {
            Letra = letra;
        }
    }
}
