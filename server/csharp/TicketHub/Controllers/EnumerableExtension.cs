

using System.Collections.Generic;
using System.Linq.Expressions;
using System.Reflection;
using Newtonsoft.Json;

namespace TicketHub.Controllers;

public static class EnumerableExtension
{
    // TODO: Verify this works, then simplify.
    public static T ShallowClone<T>(T source)
    {
        if (source == null) return default!; // Don't care, currently.

        Type type = typeof(T);

        // Handle primitive types and strings
        if (type.IsPrimitive || type == typeof(string))
        {
            return source;
        }

        // Handle reference types
        if (type.IsClass)
        {
            object clone = Activator.CreateInstance(type)!; // Should never be null by this point.
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

            foreach (FieldInfo field in fields)
            {
                field.SetValue(clone, field.GetValue(source));
            }

            return (T)clone;
        }

        // Handle value types (structs)
        if (type.IsValueType)
        {
            return source;
        }

        throw new ArgumentException($"Unable to clone type {type.Name}");
    }
    public static T ApplyMask<T>(this T source, Dictionary<string, MaskingFunc> maskingRules, MappingConfiguration<T> config)
    {
        T result = ShallowClone(source);
        foreach (var kv in maskingRules)
        {
            var name = kv.Key;
            var maskingFunc = kv.Value;
            // Future: Plug this value into masking functions that use the original column's value, (e.g. hash functions).
            // var currentValue = config.GetPropertyByName(name, result);
            if (maskingFunc.Replace is not null)
            {
                config.SetPropertyByName(name, ref result, maskingFunc.Replace.Value);
            }
        }
        return result;
    }
    // public static IEnumerable<T> MaskElements<T>(this IEnumerable<T> source, Dictionary<string, MaskingFunc> maskingRules, MappingConfiguration<T> config)
    // {
    //     IEnumerable<T> result = source.Select(x =>
    // }

    // public static IEnumerable<T> MaskElements<T>(this IEnumerable<T> source, Dictionary<string, MaskingFunc> maskingRules, Dictionary<string, string> nameRemappings)
    // {

    // }
}


public struct MaskResult
{
    [JsonProperty("masks")]
    public Dictionary<string, MaskingFunc>? Masks;
}

public struct MaskingFunc
{
    [JsonProperty("replace", NullValueHandling = NullValueHandling.Ignore)]
    public ReplaceFunc? Replace;

    public struct ReplaceFunc
    {
        readonly object? Value;
    }
}

