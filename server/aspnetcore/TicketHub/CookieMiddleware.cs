using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

public class CustomCookieAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    [Obsolete]
    public CustomCookieAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISystemClock clock) : base(options, logger, encoder, clock)
    {
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        string? rawCookieHeader = Request.Headers["Cookie"];

        // Cookie not found? Error out.
        if (string.IsNullOrEmpty(rawCookieHeader))
        {
            return AuthenticateResult.NoResult();
        }

        // Parse the cookie value.
        string pattern = @"user=(?<tenant>[^/]+) / (?<subject>[^;]+)";
        Match match = Regex.Match(rawCookieHeader, pattern);
        if (!match.Success)
        {
            return AuthenticateResult.Fail("Invalid cookie format");
        }
        // Extract the values using named capture groups
        string tenant = match.Groups["tenant"].Value.Trim();
        string subject = match.Groups["subject"].Value.Trim();


        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, subject),
            new Claim(ClaimTypes.Name, subject),
            new Claim("Tenant", tenant),
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}