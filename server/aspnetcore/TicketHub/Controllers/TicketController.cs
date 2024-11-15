using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System.Linq.Expressions;
using System.Net.Mime;
using System.Security.Claims;
using TicketHub.Database;

namespace TicketHub.Controllers;

public class UCASTNode
{
    [JsonProperty("type")]
    public required string Type;

    [JsonProperty("operation")]
    public required string Op;

    [JsonProperty("field")]
    public string? Field;

    [JsonProperty("value")]
    public required object Value; // Either another string, or a List<UCASTNode>.
}

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
        //return await _dbContext.Tenants.Where(tenant => tenant.Name == name).FirstAsync(); // Original
        // Attempt to use UCAST for the filtering here:
        UCASTNode conditions = new UCASTNode() { Type = "field", Op = "eq", Field = "Name", Value = name };
        return await _dbContext.Tenants.ApplyUCASTFilter(conditions).FirstAsync();
    }
}


public static class QueryableExtensions
{
    public static IQueryable<T> ApplyUCASTFilter<T>(this IQueryable<T> source, UCASTNode root)
    {
        var parameter = Expression.Parameter(typeof(T), "SourceType");
        var expression = BuildExpression<T>(root, parameter);
        return source.Where(Expression.Lambda<Func<T, bool>>(expression, parameter));
    }

    private static Expression BuildExpression<T>(UCASTNode node, ParameterExpression parameter)
    {
        switch (node.Type.ToLower())
        {
            case "field":
                return BuildFieldExpression<T>(node, parameter);
            case "document":
                return BuildFieldExpression<T>(node, parameter); // TODO: Fix this to provide actual document-level operations.
            case "compound":
                return BuildCompoundExpression<T>(node, parameter);
            default:
                throw new ArgumentException($"Unknown node type: {node.Type}");
        }
    }

    private static Expression BuildFieldExpression<T>(UCASTNode node, ParameterExpression parameter)
    {
        var property = Expression.Property(parameter, node.Field!);
        var value = Expression.Constant(node.Value); // TODO: Check that this reflects correctly.

        // Switch expression:
        return node.Op.ToLower() switch
        {
            "eq" => Expression.Equal(property, value),
            "ne" => Expression.NotEqual(property, value),
            "gt" => Expression.GreaterThan(property, value),
            "ge" => Expression.GreaterThanOrEqual(property, value),
            "gte" => Expression.GreaterThanOrEqual(property, value),
            "lt" => Expression.LessThan(property, value),
            "le" => Expression.LessThanOrEqual(property, value),
            "lte" => Expression.LessThanOrEqual(property, value),
            "contains" => Expression.Call(property, typeof(string).GetMethod("Contains", new[] { typeof(string) }), value),
            _ => throw new ArgumentException($"Unknown operation: {node.Op}"),
        };
    }

    private static Expression BuildCompoundExpression<T>(UCASTNode node, ParameterExpression parameter)
    {
        var childNodes = (List<UCASTNode>)node.Value;
        var childExpressions = childNodes.Select(child => BuildExpression<T>(child, parameter));

        // Switch expression:
        return node.Op.ToLower() switch
        {
            "and" => childExpressions.Aggregate(Expression.AndAlso),
            "or" => childExpressions.Aggregate(Expression.OrElse),
            _ => throw new ArgumentException($"Unknown group operation: {node.Op}"),
        };
    }
}