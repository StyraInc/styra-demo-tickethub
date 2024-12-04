
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace TicketHub.Authorization;

public class UCASTNode
{
    [JsonProperty("type")]
    public required string Type;

    [JsonProperty("operator")]
    public required string Op;

    [JsonProperty("field")]
    public string? Field;

    [JsonProperty("value")]
    [JsonConverter(typeof(UCASTNodeValueConverter))]
    public object? Value; // Either another string, or a List<UCASTNode>.
}

public class UCASTNodeValueConverter : JsonConverter
{
    public override bool CanConvert(Type objectType)
    {
        return objectType == typeof(object);
    }

    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        JToken token = JToken.Load(reader);
        if (token.Type == JTokenType.Array)
        {
            return token.ToObject<List<UCASTNode>>();
        }

        return token.ToObject<object>();
    }

    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        serializer.Serialize(writer, value);
    }

    // public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    // {
    //     throw new NotImplementedException();
    // }
}
