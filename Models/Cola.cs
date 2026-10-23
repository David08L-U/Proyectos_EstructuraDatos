namespace Proyectos_Estructuras.Models
{
    // Cola (FIFO: el primero en entrar es el primero en salir).
    // Tiene capacidad máxima para poder validar sobreflujo con ColaLlena().
    public class Cola<T>
    {
        private Nodo<T>? frente;
        private Nodo<T>? final;
        private int cantidad;
        private readonly int capacidad;

        public Cola(int capacidad = 10)
        {
            this.capacidad = capacidad;
        }

        public int Contar() => cantidad;
        public int Capacidad => capacidad;

        public bool ColaVacia() => frente == null;
        public bool ColaLlena() => cantidad >= capacidad;

        // Inserta al final de la cola
        public void InsertaCola(T dato)
        {
            if (ColaLlena())
                throw new InvalidOperationException("Sobreflujo: la cola está llena.");

            Nodo<T> nuevo = new Nodo<T>(dato);
            if (final == null)
            {
                frente = nuevo;
                final = nuevo;
            }
            else
            {
                final.Siguiente = nuevo;
                final = nuevo;
            }
            cantidad++;
        }

        // Elimina y regresa el elemento del frente
        public T EliminaCola()
        {
            if (frente == null)
                throw new InvalidOperationException("Subflujo: la cola está vacía.");

            T dato = frente.Dato;
            frente = frente.Siguiente;
            if (frente == null)
                final = null;     // se quedó vacía
            cantidad--;
            return dato;
        }

        public T? VerFrente() => frente != null ? frente.Dato : default;
        public T? VerFinal() => final != null ? final.Dato : default;

        public List<T> ObtenerTodos()
        {
            List<T> resultado = new List<T>();
            Nodo<T>? actual = frente;
            while (actual != null)
            {
                resultado.Add(actual.Dato);
                actual = actual.Siguiente;
            }
            return resultado;
        }
    }
}
