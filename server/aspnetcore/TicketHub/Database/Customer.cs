namespace TicketHub.Database;

public partial class Customer
{
    public int Id { get; set; }

    public int Tenant { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public virtual Tenant TenantNavigation { get; set; } = null!;

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
