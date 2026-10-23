namespace Proyectos_Estructuras.Models
{
    // Lista simplemente ligada hecha a mano.
    public class Lista<T>
    {
        private Nodo<T>? inicio;
        private int cantidad;

        public int Contar() => cantidad;
        public bool EstaVacia() => inicio == null;

        // Agrega un elemento al final de la lista
        public void Agregar(T dato)
        {
            Nodo<T> nuevo = new Nodo<T>(dato);

            if (inicio == null)
            {
                inicio = nuevo;
            }
            else
            {
                Nodo<T> actual = inicio;
                while (actual.Siguiente != null)
                    actual = actual.Siguiente;
                actual.Siguiente = nuevo;
            }
            cantidad++;
        }

        // Elimina el primer elemento que cumpla la condición.
        // Regresa el elemento eliminado, o default si no lo encontró.
        public T? Eliminar(Func<T, bool> condicion)
        {
            Nodo<T>? actual = inicio;
            Nodo<T>? anterior = null;

            while (actual != null)
            {
                if (condicion(actual.Dato))
                {
                    if (anterior == null)
                        inicio = actual.Siguiente;      // era el primero
                    else
                        anterior.Siguiente = actual.Siguiente;

                    cantidad--;
                    return actual.Dato;
                }
                anterior = actual;
                actual = actual.Siguiente;
            }
            return default;
        }

        // Busca el primer elemento que cumpla la condición
        public T? Buscar(Func<T, bool> condicion)
        {
            Nodo<T>? actual = inicio;
            while (actual != null)
            {
                if (condicion(actual.Dato))
                    return actual.Dato;
                actual = actual.Siguiente;
            }
            return default;
        }

        // Vacía la lista
        public void Limpiar()
        {
            inicio = null;
            cantidad = 0;
        }

        // Recorre la lista y regresa los datos (para mandarlos al frontend como JSON)
        public List<T> ObtenerTodos()
        {
            List<T> resultado = new List<T>();
            Nodo<T>? actual = inicio;
            while (actual != null)
            {
                resultado.Add(actual.Dato);
                actual = actual.Siguiente;
            }
            return resultado;
        }
    }
}
