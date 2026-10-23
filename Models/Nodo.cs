namespace Proyectos_Estructuras.Models
{
    // Nodo simple: guarda un dato y apunta al siguiente nodo.
    // Lo usan Lista, Pila y Cola.
    public class Nodo<T>
    {
        public T Dato { get; set; }
        public Nodo<T>? Siguiente { get; set; }

        public Nodo(T dato)
        {
            Dato = dato;
            Siguiente = null;
        }
    }
}
