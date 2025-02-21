using Newtonsoft.Json;

namespace TicketHub.Database;

public partial class Tenant
{
    [JsonProperty("id")]
    public int Id { get; set; }

    [JsonProperty("name")]
    public string? Name { get; set; }

    [JsonProperty("region")]
    public string? Region { get; set; }

    [JsonProperty("customers")]
    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    [JsonProperty("users")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();

    [JsonProperty("tickets")]
    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
