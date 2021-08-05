Title: Entity Framework Core Scaffold a MySQL Database
Date: 2021-08-04 20:40
tags: entity framework core, dotnet, mysql

These are some brief instructions for scaffolding a MySQL database with Entity Framework Core 3.1. A MySQL database is required. To get a MySQL database running for local development with Docker, refer to <a href="https://jasonfigueroa.github.io/local-mysql-database-with-docker-compose.html" target="_blank">Local MySQL Database with Docker Compose</a>.

1. Create a .NET Core console app

        dotnet new console -o Chinook

2. cd into the project

3. Add the following packages

        dotnet add package Pomelo.EntityFrameworkCore.MySql --version 3.1.2
        dotnet add package Microsoft.EntityFrameworkCore.Design --version 3.1.4

4. Run the following, replace any values accordingly

        dotnet ef dbcontext scaffold "Server=localhost;Database=Chinook;User=user;Password=userpass;Port=33060;TreatTinyAsBoolean=true;" "Pomelo.EntityFrameworkCore.MySql"

---

The following is a basic crud app.

```csharp
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace Chinook
{
    class Program
    {
        static void Main(string[] args)
        {
            using (var db = new ChinookContext())
            {
                // Create                
                var britneySpears = new Artist();
                britneySpears.Name = "Britney Spears";
                db.Artist.Add(britneySpears);
                
                
                // Read                
                var acdc = db.Artist
                    .Include(a => a.Album) // Eager loading, exclude this for lazy loading
                    .Where(a => a.Name == "AC/DC")
                    .FirstOrDefault();

                // Update                
                var forThoseAboutToRock = db.Album
                    .Where(a => a.ArtistId == acdc.ArtistId && a.Title == "For Those About To Rock We Salute You")
                    .FirstOrDefault();
                
                forThoseAboutToRock.Title = "Title Changed!";

                // Delete                
                db.Remove(britneySpears);

                db.SaveChanges();
            }
        }
    }
}
```