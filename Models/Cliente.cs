namespace Proyectos_Estructuras.Models
{
    // Cliente del banco (Colas: ejercicio 1)
    public class Cliente
    {
        public int Turno { get; set; }
        public string Nombre { get; set; } = "";
        public string Movimiento { get; set; } = "";
        public DateTime HoraLlegada { get; set; }

        public Cliente() { }

        public Cliente(int turno, string nombre, string movimiento)
        {
            Turno = turno;
            Nombre = nombre;
            Movimiento = movimiento;
            HoraLlegada = DateTime.Now;
        }
    }
}
