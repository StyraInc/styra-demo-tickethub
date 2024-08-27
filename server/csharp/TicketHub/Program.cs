using Microsoft.AspNetCore.Diagnostics;
using Newtonsoft.Json;
using TicketHub.Authorization;
using TicketHub.Database;

var builder = WebApplication.CreateBuilder(args);

// Add services to the builder.
builder.Services.AddSingleton<OpaAuthzService>();
builder.Services.AddDbContext<PostgresContext>();
builder.Services.AddLogging();
builder.Services.AddControllers().AddNewtonsoftJson(opts =>
{
    opts.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    opts.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
});
builder.Services.AddExceptionHandler<CustomExceptionHandler>();

// Create the top-level application.
var app = builder.Build();

// Wire in middleware.
app.UseCookieAuthMiddleware();
app.MapControllers();

// Start up the server.
app.Run();

// Custom handler for exceptions, so that most of our unhandled exceptions will
// appear as HTTP 500's.
internal class CustomExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellation)
    {
        context.Response.StatusCode = 500;
        var error = new { message = exception.Message };
        await context.Response.WriteAsJsonAsync(error, cancellation);
        return true;
    }
}
