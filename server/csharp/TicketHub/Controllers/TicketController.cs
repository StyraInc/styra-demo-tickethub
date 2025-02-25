using System.Linq.Expressions;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Styra.Opa;
using Styra.Ucast.Linq;
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
    private readonly MappingConfiguration<Ticket> _ticketMapping;
    private readonly string opaURL = Environment.GetEnvironmentVariable("OPA_URL") ?? "http://localhost:8181";

    public record TicketFields(string customer, string description);
    public record ResolveFields(bool resolved);
    public record AssignFields(string assignee);

    private async Task<Customer> addCustomer(Tenant tenant, string name)
    {
        Customer c = new()
        {
            Name = name,
            Tenant = tenant.Id
        };
        await _dbContext.Customers.AddAsync(c);
        return c;
    }

    public TicketController(ILogger<TicketController> logger, PostgresContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;

        // Remove keys that won't be found in the policy.
        // _ticketMapper.Remove("tickets.user.id");
        // _ticketMapper.Remove("tickets.user.name");
        // _ticketMapper.Remove("tickets.user.tenant");

        _ticketMapping = new EFCoreMappingConfiguration<Ticket>(new Dictionary<string, string> {
            {"users.id", "tickets.UserNavigation.Id"},
            {"users.name", "tickets.UserNavigation.Name"},
            {"users.tenant", "tickets.UserNavigation.Tenant"},
        }, prefix: "tickets");
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
    [OpaRuleAuthorization("tickets/allow", "list")]
    public async Task<ActionResult<IAsyncEnumerable<Ticket>>> ListTickets()
    {
        var tName = HttpContext.Items["Tenant"]?.ToString();
        string subject = HttpContext.Items["Subject"]?.ToString() ?? "";
        if (tName is string)
        {
            Tenant tenant = await getTenantByName(tName);
            var conditions = await getConditions(HttpContext, "data.tickets.filters.include", new Dictionary<string, object>(){
                { "tenant", tenant },
                { "user", subject },
                { "action", "list" },
            });
            if (conditions is null)
            {
                return StatusCode(404, "No tickets found");
            }

            var maskingRules = await getMaskingRules(HttpContext, "tickets/filters/masks", new Dictionary<string, object>(){
                { "tenant", tenant },
                { "user", subject },
                { "action", "list" },
            });

            // Log the condition expression for debugging, with a dummy target parameter.
            _logger.LogInformation(QueryableExtensions.BuildExpression<Ticket>(conditions, Expression.Parameter(typeof(Ticket), "x"), _ticketMapping).ToString());

            List<Ticket> filteredTickets = await _dbContext.Tickets
                .Include(t => t.CustomerNavigation)
                .Include(t => t.TenantNavigation)
                .Include(t => t.UserNavigation)
                .ApplyUCASTFilter(conditions, _ticketMapping)
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("masks: {masks}", maskingRules);
            var tickets = filteredTickets.MaskElements(maskingRules, _ticketMapping);
            _logger.LogInformation("Tickets after masking: {tickets}", tickets);

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

    [HttpDelete]
    [Route("tickets/{id:int}/assign")]
    [OpaRuleAuthorization("tickets/allow", "assign")]
    public async Task<ActionResult<Ticket>> UnassignTicket(int id)
    {
        Ticket? ticket = await _dbContext.Tickets.FindAsync(id);
        if (ticket is null)
        {
            return NotFound();
        }
        ticket.Assignee = null;
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

    public struct CompileUCASTResult
    {
        [JsonProperty("result")]
        public CompileResult Result;

        public struct CompileResult
        {
            [JsonProperty("query", NullValueHandling = NullValueHandling.Ignore)]
            public UCASTNode? Conditions;
        }
    }

    private async Task<UCASTNode?> getConditions(HttpContext context, string query, object input)
    {
        var url = opaURL + "/v1/compile";
        using var client = new HttpClient();
        var jsonififed = JsonConvert.SerializeObject(new Dictionary<string, object>(){
                { "query", query },
                { "input", input },
                { "unknowns", new List<object>() {"input.tickets", "input.users"} },
            });
        var content = new StringContent(jsonififed, System.Text.Encoding.UTF8, "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.styra.ucast.linq+json"));
        request.Content = content;

        HttpResponseMessage response = await client.SendAsync(request);

        if (response.IsSuccessStatusCode)
        {
            string responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation(responseBody);
            CompileUCASTResult result = JsonConvert.DeserializeObject<CompileUCASTResult>(responseBody);
            return result.Result.Conditions;
        }
        else
        {
            string responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogError(responseBody);
            // Handle the error
            return null;
        }
    }

    private async Task<Dictionary<string, MaskingFunc>> getMaskingRules(HttpContext context, string path, object input)
    {
        string tenant = context.Items["Tenant"]?.ToString() ?? "";
        string subject = context.Items["Subject"]?.ToString() ?? "";
        var authzService = context.RequestServices.GetRequiredService<OpaAuthzService>();
        OpaClient opa = authzService.GetClient();

        var result = await opa.evaluate<Dictionary<string, MaskingFunc>>(path, new Dictionary<string, object>(){
            { "tenant", tenant },
            { "user", subject },
            { "action", "list" },
        });
        return result;
    }
}
