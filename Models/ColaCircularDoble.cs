namespace Proyectos_Estructuras.Models
{
    // Cola Circular Doblemente Ligada (estacionamiento tipo "callejón").
    // - Doble: cada nodo conoce al siguiente y al anterior.
    // - Circular: el último apunta al primero y el primero al último.
    // - Sin límite de cupo.
    public class ColaCircularDoble<T>
    {
        private NodoDoble<T>? frente;   // el que sale primero
        private int cantidad;

        public int Contar() => cantidad;
        public bool EstaVacia() => frente == null;

        // Inserta al final (justo "antes" del frente en el círculo)
        public void Insertar(T dato)
        {
            NodoDoble<T> nuevo = new NodoDoble<T>(dato);

            if (frente == null)
            {
                nuevo.Siguiente = nuevo;
                nuevo.Anterior = nuevo;
                frente = nuevo;
            }
            else
            {
                NodoDoble<T> final = frente.Anterior!;
                final.Siguiente = nuevo;
                nuevo.Anterior = final;
                nuevo.Siguiente = frente;
                frente.Anterior = nuevo;
            }
            cantidad++;
        }

        // Saca el elemento del frente
        public T Eliminar()
        {
            if (frente == null)
                throw new InvalidOperationException("El estacionamiento está vacío.");

            T dato = frente.Dato;

            if (frente.Siguiente == frente)
            {
                frente = null;   // era el único
            }
            else
            {
                NodoDoble<T> final = frente.Anterior!;
                NodoDoble<T> nuevoFrente = frente.Siguiente!;
                final.Siguiente = nuevoFrente;
                nuevoFrente.Anterior = final;
                frente = nuevoFrente;
            }
            cantidad--;
            return dato;
        }

        public T? VerFrente() => frente != null ? frente.Dato : default;
        public T? VerFinal() => frente != null ? frente.Anterior!.Dato : default;

        // Recorre el círculo una sola vuelta
        public List<T> ObtenerTodos()
        {
            List<T> resultado = new List<T>();
            if (frente == null) return resultado;

            NodoDoble<T> actual = frente;
            do
            {
                resultado.Add(actual.Dato);
                actual = actual.Siguiente!;
            } while (actual != frente);

            return resultado;
        }
    }
}
