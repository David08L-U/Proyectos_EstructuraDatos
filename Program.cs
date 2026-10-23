// ============================================================
//  Program.cs
//  Punto de arranque de la aplicación.
//  - Habilita los controladores (la API en C#)
//  - Sirve el frontend que está en la carpeta wwwroot
// ============================================================

var builder = WebApplication.CreateBuilder(args);

// Registra los controladores (ListasController, PilasController, ColasController)
builder.Services.AddControllers();

var app = builder.Build();

// Abre index.html automáticamente al entrar a la página
app.UseDefaultFiles();

// Permite servir los archivos de wwwroot (html, css, js, imágenes)
app.UseStaticFiles();

// Conecta las rutas /api/... con sus controladores
app.MapControllers();

app.Run();
