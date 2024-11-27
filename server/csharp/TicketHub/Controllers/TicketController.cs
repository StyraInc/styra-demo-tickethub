using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Styra.Opa;
using System.Linq.Expressions;
using System.Net.Mime;
using System.Reflection;
using System.Reflection.Metadata;
using System.Runtime.CompilerServices;
using TicketHub.Authorization;
using TicketHub.Database;

namespace TicketHub.Controllers;

[ApiController]
[Route("/api")]
[Produces("application/json")]
[Consumes(MediaTypeNames.Application.Json)]
public class TicketController : ControllerBase
{
    private readonly ILogger<TicketController> _logger;
    private readonly PostgresContext _dbContext;

    public record TicketFields(string customer, string description);
    public record ResolveFields(bool resolved);
    public record AssignFields(string assignee);

    private async Task<Customer> addCustomer(Tenant tenant, string name)
    {
        Customer c = new Customer();
        c.Name = name;
        c.Tenant = tenant.Id;
        await _dbContext.Customers.AddAsync(c);
        return c;
    }

    public TicketController(ILogger<TicketController> logger, PostgresContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public static Dictionary<string, Dictionary<string, FieldInfo>> CreateFieldInfoMapping(params Type[] dbSetTypes)
    {
        var mapping = new Dictionary<string, Dictionary<string, FieldInfo>>();

        foreach (var dbSetType in dbSetTypes)
        {
            var entityType = dbSetType.GetGenericArguments()[0];
            var fieldInfos = entityType.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

            var fieldMapping = new Dictionary<string, FieldInfo>();
            foreach (var fieldInfo in fieldInfos)
            {
                fieldMapping[fieldInfo.Name] = fieldInfo;
            }

            mapping[entityType.Name] = fieldMapping;
        }

        return mapping;
    }

    // List all tickets.
    [HttpGet]
    [Route("tickets")]
    [OpaRuleAuthorization("tickets_expanded/allow", "list")]
    public async Task<ActionResult<IAsyncEnumerable<Ticket>>> ListTickets()
    {
        var tName = HttpContext.Items["Tenant"]?.ToString();
        string subject = HttpContext.Items["Subject"]?.ToString() ?? "";
        // The mapping here is laborious, but this is the price we're currently
        // paying for having to work in LINQ's constraints. All queries have to
        // be built out *relative* to some base `IQueryable<T>` object.
        var mapper = new Dictionary<string, Func<ParameterExpression, Expression>>()
        {
            { "tickets.id", t => Expression.Property(t, "Id") },
            { "tickets.customer", t => Expression.Property(t, "Customer") },
            { "tickets.customer.name", t => Expression.Property(t, "CustomerName") },
            { "tickets.tenant", t => Expression.Property(t, "Tenant") },
            { "tickets.tenant.name", t => Expression.Property(t, "TenantName") },
            { "tickets.assignee", t => Expression.Property(t, "Assignee") },
            { "tickets.assignee.name", t => Expression.Property(t, "UserName") },
            { "tickets.description", t => Expression.Property(t, "Description") },
            { "tickets.resolved", t => Expression.Property(t, "Resolved") },
            { "tickets.last_updated", t => Expression.Property(t, "LastUpdated") },
            { "users.id", t => Expression.Property(Expression.Property(t, "UserNavigation"), "Id") },
            { "users.name", t => Expression.Property(Expression.Property(t, "UserNavigation"), "Name") },
            { "users.tenant", t => Expression.Property(Expression.Property(t, "UserNavigation"), "Tenant") },
        };
        if (tName is string)
        {
            Tenant tenant = await getTenantByName(tName);
            var conditions = await getConditions(HttpContext, "tickets_expanded/response", new Dictionary<string, object>(){
                { "tenant", tenant },
                { "user", subject },
                { "action", "list" },
            });
            if (conditions is null)
            {
                return StatusCode(404, "No tickets found");
            }

            // Log the condition expression for debugging, with a dummy target parameter.
            _logger.LogInformation(QueryableExtensions.BuildExpression<Ticket>(conditions, Expression.Parameter(typeof(Ticket), "x"), mapper).ToString());

            List<Ticket> tickets = await _dbContext.Tickets
                .Include(t => t.CustomerNavigation)
                .Include(t => t.TenantNavigation)
                .Include(t => t.UserNavigation)
                .ApplyUCASTFilter(conditions, mapper)
                .ToListAsync();
            return Ok(new { Tickets = tickets });
        }

        return StatusCode(404, "No tickets found");
    }

    // Get a specific ticket.
    [HttpGet]
    [Route("tickets/{id:int}")]
    [OpaRuleAuthorization("tickets/allow", "get")]
    public async Task<ActionResult<Ticket>> GetTicket(int id)
    {
        Ticket? ticket = await _dbContext.Tickets
            .Include(t => t.CustomerNavigation)
            .Include(t => t.TenantNavigation)
            .FirstOrDefaultAsync(t => t.Id == id);
        return Ok(ticket);
    }

    // Create a ticket.
    [HttpPost]
    [Route("tickets")]
    [OpaRuleAuthorization("tickets/allow", "create")]
    public async Task<ActionResult<Ticket>> CreateTicket([FromBody] TicketFields tf)
    {
        string tenant = HttpContext.Items["Tenant"]?.ToString() ?? "";
        Ticket ticket = new();
        // Fetch tenant, then create customer if needed.
        Tenant foundTenant = await _dbContext.Tenants.Where(t => t.Name == tenant).FirstAsync();
        Customer foundCustomer = await _dbContext.Customers.Where(c => c.Name == tf.customer).FirstOrDefaultAsync() ?? await addCustomer(foundTenant, tf.customer);

        // Update ticket fields.
        ticket.Description = tf.description;
        ticket.LastUpdated = DateTime.UtcNow.ToLocalTime();
        ticket.Tenant = foundTenant.Id;
        ticket.Customer = foundCustomer.Id;

        // Add ticket to context, then propagate changes back to DB.
        await _dbContext.Tickets.AddAsync(ticket);
        await _dbContext.SaveChangesAsync();
        return Ok(ticket);
    }

    // Resolve a ticket.
    [HttpPost]
    [Route("tickets/{id:int}/resolve")]
    [OpaRuleAuthorization("tickets/allow", "resolve")]
    public async Task<ActionResult<Ticket>> ResolveTicket(int id, [FromBody] ResolveFields rf)
    {
        Ticket? ticket = await _dbContext.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }
        ticket.Resolved = rf.resolved;
        ticket.LastUpdated = DateTime.UtcNow.ToLocalTime();
        await _dbContext.SaveChangesAsync();
        return Ok(ticket);
    }

    // Assign a ticket.
    [HttpPost]
    [Route("tickets/{id:int}/assign")]
    [OpaRuleAuthorization("tickets/allow", "assign")]
    public async Task<ActionResult<Ticket>> AssignTicket(int id, [FromBody] AssignFields af)
    {
        Ticket? ticket = await _dbContext.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }
        User? user = await _dbContext.Users.Where(u => u.Name == af.assignee && u.Tenant == ticket.Tenant).FirstAsync();
        if (user is null)
        {
            return NotFound();
        }
        ticket.Assignee = user.Id;
        ticket.LastUpdated = DateTime.UtcNow.ToLocalTime();
        await _dbContext.SaveChangesAsync();
        return Ok(ticket);
    }

    private async Task<Tenant> getTenantByName(string name)
    {
        return await _dbContext.Tenants.Where(tenant => tenant.Name == name).FirstAsync();
    }

    public struct PolicyResult
    {
        [JsonProperty("allow")]
        public bool Allow;

        [JsonProperty("reason")]
        public string Reason;

        [JsonProperty("conditions", NullValueHandling = NullValueHandling.Ignore)]
        public UCASTNode? Conditions;
    }

    private async Task<UCASTNode?> getConditions(HttpContext context, string path, object input)
    {
        var authzService = context.RequestServices.GetRequiredService<OpaAuthzService>();
        OpaClient opa = authzService.GetClient();

        PolicyResult result = await opa.evaluate<PolicyResult>(path, input);
        _logger.LogInformation(JsonConvert.SerializeObject(result));
        return result.Conditions;
    }
}
