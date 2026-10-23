namespace Proyectos_Estructuras.Models
{
    // Producto (Listas: ejercicios 1 y 4)
    public class Producto
    {
        public int Clave { get; set; }
        public string Nombre { get; set; } = "";
        public int Cantidad { get; set; }
        public decimal Precio { get; set; }

        public Producto() { }

        public Producto(int clave, string nombre, int cantidad, decimal precio)
        {
            Clave = clave;
            Nombre = nombre;
            Cantidad = cantidad;
            Precio = precio;
        }
    }
}
