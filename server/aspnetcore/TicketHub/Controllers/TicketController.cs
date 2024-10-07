using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mime;
using System.Security.Claims;
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

    private async Task<Customer> addCustomer(Tenant tenant, string name)
    {
        Customer c = new()
        {
            Name = name,
            Tenant = tenant.Id,
        };
        await _dbContext.Customers.AddAsync(c);
        return c;
    }

    public TicketController(ILogger<TicketController> logger, PostgresContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    // List all tickets.
    [HttpGet]
    [Route("tickets")]
    public async Task<ActionResult<IAsyncEnumerable<Ticket>>> ListTickets()
    {
        var tName = User.FindFirstValue("Tenant");
        if (tName is string)
        {
            Tenant tenant = await getTenantByName(tName);
            List<Ticket> tickets = await _dbContext.Tickets
                .Include(t => t.CustomerNavigation)
                .Include(t => t.TenantNavigation)
                .Where(t => t.Tenant == tenant.Id)
                .ToListAsync();
            return Ok(new { Tickets = tickets });
        }
        return StatusCode(500, "No tickets found");
    }

    // Get a specific ticket.
    [HttpGet]
    [Route("tickets/{id:int}")]
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
    public async Task<ActionResult<Ticket>> CreateTicket([FromBody] TicketFields tf)
    {
        var tenant = User.FindFirstValue("Tenant");
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

    private async Task<Tenant> getTenantByName(string name)
    {
        return await _dbContext.Tenants.Where(tenant => tenant.Name == name).FirstAsync();
    }
}
