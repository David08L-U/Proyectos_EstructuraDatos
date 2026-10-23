namespace Proyectos_Estructuras.Models
{
    // Pila (LIFO: el último en entrar es el primero en salir).
    public class Pila<T>
    {
        private Nodo<T>? tope;
        private int cantidad;

        public int Contar() => cantidad;
        public bool EstaVacia() => tope == null;

        // Push: mete un elemento arriba de la pila
        public void Push(T dato)
        {
            Nodo<T> nuevo = new Nodo<T>(dato);
            nuevo.Siguiente = tope;
            tope = nuevo;
            cantidad++;
        }

        // Pop: saca el elemento de arriba
        public T Pop()
        {
            if (tope == null)
                throw new InvalidOperationException("La pila está vacía.");

            T dato = tope.Dato;
            tope = tope.Siguiente;
            cantidad--;
            return dato;
        }

        // Peek: mira el elemento de arriba sin sacarlo
        public T Peek()
        {
            if (tope == null)
                throw new InvalidOperationException("La pila está vacía.");
            return tope.Dato;
        }

        // Regresa los datos desde el tope hacia abajo
        public List<T> ObtenerTodos()
        {
            List<T> resultado = new List<T>();
            Nodo<T>? actual = tope;
            while (actual != null)
            {
                resultado.Add(actual.Dato);
                actual = actual.Siguiente;
            }
            return resultado;
        }
    }
}
