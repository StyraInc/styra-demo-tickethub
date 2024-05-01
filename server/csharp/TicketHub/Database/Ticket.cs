﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Authentication;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TicketHub.Database;

public partial class Ticket
{
    public int Id { get; set; }

    public string? Description { get; set; }

    public DateTime LastUpdated { get; set; }

    public bool Resolved { get; set; }

    [JsonIgnore]
    public int Customer { get; set; }

    [JsonIgnore]
    public int Tenant { get; set; }

    [JsonIgnore]
    public virtual Customer CustomerNavigation { get; set; } = null!;

    [JsonIgnore]
    public virtual Tenant TenantNavigation { get; set; } = null!;

    [JsonProperty("customer")]
    public string CustomerName => CustomerNavigation?.Name ?? "";

    [JsonProperty("tenant")]
    public string TenantName => TenantNavigation?.Name ?? "";
}

public class TicketConverter : JsonConverter
{
    public override bool CanConvert(Type objectType)
    {
        return objectType == typeof(Ticket);
    }

    public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
    {
        if (value is not null && value is Ticket ticket)
        {
            var jsonObject = JObject.FromObject(ticket, serializer);

            // Remove unwanted properties
            jsonObject.Remove("CustomerNavigation");
            jsonObject.Remove("TenantNavigation");

            // Replace CustomerId and TenantId with respective names
            jsonObject["Customer"] = ticket.CustomerName;
            jsonObject["Tenant"] = ticket.TenantName;

            jsonObject.WriteTo(writer);
        }
        else
        {
            throw new JsonSerializationException("Null object provided.");
        }
    }

    public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
    {
        throw new NotImplementedException();
    }
}
