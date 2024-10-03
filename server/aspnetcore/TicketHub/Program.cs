using Microsoft.AspNetCore.Diagnostics;
using Newtonsoft.Json;
using TicketHub.Database;
using Styra.Opa;
using Styra.Opa.AspNetCore;
using Microsoft.AspNetCore.Authentication;


string opaURL = System.Environment.GetEnvironmentVariable("OPA_URL") ?? "http://localhost:8181";
OpaClient opa = new OpaClient(opaURL);

var builder = WebApplication.CreateBuilder(args);

// Add services to the builder.
builder.Services.AddDbContext<PostgresContext>();
builder.Services.AddLogging(builder => builder.SetMinimumLevel(LogLevel.Trace).AddConsole());
builder.Services.AddControllers().AddNewtonsoftJson(opts =>
{
    opts.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    opts.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
});
builder.Services.AddExceptionHandler<CustomExceptionHandler>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "CustomCookieAuth";
    options.DefaultChallengeScheme = "CustomCookieAuth";
}).AddScheme<AuthenticationSchemeOptions, CustomCookieAuthenticationHandler>(
    "CustomCookieAuth", options => { });

// Create the top-level application.
var app = builder.Build();

// Wire in middleware.
app.UseAuthentication();
app.UseMiddleware<OpaAuthorizationMiddleware>(opa, "tickets/aspnetcore/main");
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
