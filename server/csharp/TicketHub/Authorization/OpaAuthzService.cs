using Styra.Opa;

namespace TicketHub.Authorization;

// Custom singleton service.
public class OpaAuthzService
{
    private readonly OpaClient opa;
    public OpaAuthzService(ILogger<OpaClient> logger)
    {
        string opaUrl = Environment.GetEnvironmentVariable("OPA_URL") ?? "http://localhost:8181";
        opa = new OpaClient(opaUrl, logger);
        logger.LogInformation("OPA Client initialized");
    }

    public OpaClient GetClient()
    {
        return opa;
    }
}