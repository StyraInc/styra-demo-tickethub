using System;
using System.Collections.Generic;

namespace TicketHub.Database;

public partial class Tenant
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
