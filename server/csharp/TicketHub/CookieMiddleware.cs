using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

public class UseCookieAuthMiddleware
{
    private readonly RequestDelegate _next;

    public UseCookieAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        // Note(philip): Because the cookie value we're using has invalid
        // characters (spaces), we have to hack the cookie value out of the
        // Cookie header ourselves. ASP.NET follows the RFC for cookie parsing,
        // so it will reject the user cookie if we try to extract it with
        // context.Request.Cookies["user"].
        string? rawCookieHeader = context.Request.Headers["Cookie"];

        // Cookie not found? Error out.
        if (string.IsNullOrEmpty(rawCookieHeader))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("{\"error\": \"authentication error: user credentials not provided\"}");
            return;
        }

        // Parse the cookie value.
        string pattern = @"user=(?<tenant>[^/]+) / (?<subject>[^;]+)";
        Match match = Regex.Match(rawCookieHeader, pattern);
        if (match.Success)
        {
            // Extract the values using named capture groups
            string tenant = match.Groups["tenant"].Value.Trim();
            string subject = match.Groups["subject"].Value.Trim();
            context.Items["Tenant"] = tenant;
            context.Items["Subject"] = subject;
        }

        await _next(context);
    }
}

public static class UseCookieAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseCookieAuthMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<UseCookieAuthMiddleware>();
    }
}