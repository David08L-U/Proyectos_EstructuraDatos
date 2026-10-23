namespace Proyectos_Estructuras.Models
{
    // Carro en la cola de atención (Colas: ejercicio 2 - Juego pintar coches)
    public class CarroJuego
    {
        public int Id { get; set; }
        public string ColorObjetivo { get; set; } = "";
        public string ColorHex { get; set; } = "";
        public DateTime HoraLlegada { get; set; } = DateTime.Now;
        public bool Pintado { get; set; }
        public string? ColorPintado { get; set; }

        public CarroJuego() { }

        public CarroJuego(int id, string colorObjetivo, string colorHex)
        {
            Id = id;
            ColorObjetivo = colorObjetivo;
            ColorHex = colorHex;
            HoraLlegada = DateTime.Now;
        }
    }

    // Registro de récord del juego pintar coches
    public class RecordJuego
    {
        public string Jugador { get; set; } = "Jugador";
        public int CarrosPintados { get; set; }
        public int TiempoTotalSegundos { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}
