namespace Proyectos_Estructuras.Models
{
    // Nodo doble: apunta al siguiente Y al anterior.
    // Lo usa la Cola Circular Doblemente Ligada (estacionamiento).
    public class NodoDoble<T>
    {
        public T Dato { get; set; }
        public NodoDoble<T>? Siguiente { get; set; }
        public NodoDoble<T>? Anterior { get; set; }

        public NodoDoble(T dato)
        {
            Dato = dato;
            Siguiente = null;
            Anterior = null;
        }
    }
}
