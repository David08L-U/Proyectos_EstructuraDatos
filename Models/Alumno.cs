namespace Proyectos_Estructuras.Models
{
    // Alumno (Listas: ejercicio 3 - Aprobados y reprobados)
    public class Alumno
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = "";
        public decimal Calificacion { get; set; }

        public Alumno() { }

        public Alumno(int id, string nombre, decimal calificacion)
        {
            Id = id;
            Nombre = nombre;
            Calificacion = calificacion;
        }

        public bool Aprobado => Calificacion >= 7.0m;
    }
}
