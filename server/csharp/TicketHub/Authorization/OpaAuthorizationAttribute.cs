
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Styra.Opa;

namespace TicketHub.Authorization;

// Custom authorization attribute, implemented as an authorization filter.
// This design allows us to template in the fields our policy needs
// in the input.
public class OpaRuleAuthorizationAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _path;
    private readonly string _action;

    public OpaRuleAuthorizationAttribute(string path, string action)
    {
        _path = path;
        _action = action;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        bool authorized = await IsAuthorized(context);
        if (!authorized)
        {
            // If not authorized, return an error response
            context.Result = new ContentResult
            {
                Content = "Not Authorized",
                StatusCode = 403,
            };
            return;
        }

        // If authorized, allow normal controller handling.
        return;
    }

    private async Task<bool> IsAuthorized(AuthorizationFilterContext context)
    {
        var httpContext = context.HttpContext;
        string tenant = httpContext.Items["Tenant"]?.ToString() ?? "";
        string subject = httpContext.Items["Subject"]?.ToString() ?? "";
        var authzService = context.HttpContext.RequestServices.GetRequiredService<OpaAuthzService>();
        OpaClient opa = authzService.GetClient();

        bool allowed = await opa.Evaluate<bool>(_path, new Dictionary<string, object>(){
            { "tenant", tenant },
            { "user", subject },
            { "action", _action },
        });
        return allowed;
    }
}


// Custom authorization attribute, implemented as an action filter.
// This design allows us to template in the fields our policy needs
// in the input.
public class OpaRuleActionFilterAttribute : ActionFilterAttribute
{
    private readonly string _path;
    private readonly string _action;

    public OpaRuleActionFilterAttribute(string path, string action)
    {
        _path = path;
        _action = action;
    }

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        bool authorized = await IsAuthorized(context);
        if (!authorized)
        {
            // If not authorized, return an error response
            context.Result = new ContentResult
            {
                Content = "Not Authorized",
                StatusCode = 403,
            };
            return;
        }

        // If authorized, continue to the controller action.
        await next();
    }

    private async Task<bool> IsAuthorized(ActionExecutingContext context)
    {
        var httpContext = context.HttpContext;
        string tenant = httpContext.Items["Tenant"]?.ToString() ?? "";
        string subject = httpContext.Items["Subject"]?.ToString() ?? "";
        var authzService = context.HttpContext.RequestServices.GetRequiredService<OpaAuthzService>();
        OpaClient opa = authzService.GetClient();

        bool allowed = await opa.Evaluate<bool>(_path, new Dictionary<string, object>(){
            { "tenant", tenant },
            { "user", subject },
            { "action", _action },
        });
        return allowed;
    }
}
