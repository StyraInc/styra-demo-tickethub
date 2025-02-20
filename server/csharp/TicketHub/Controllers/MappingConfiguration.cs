

using System.Linq.Expressions;
using Newtonsoft.Json;

namespace TicketHub.Controllers;

// Name mappings should start with $[a-zA-Z0-9_]*
// Examples: $this.Customer.Id, $.Customer.Id


public class NameToLINQExpressionConfiguration : Dictionary<string, Func<ParameterExpression, Expression>>;

/// <summary>
/// This type helps wrap up the complexities of building LINQ expressions filtering, and for generating dynamic property lookups.
/// </summary>
/// <typeparam name="T">The type to build a name mapping config over.</typeparam>
public class MappingConfiguration<T>
{
    // Cache of generated mappings, so we don't have to reconstruct them every time.
    private Dictionary<string, string> nameMappings = new(typeof(T).GetProperties().Length);
    private Dictionary<string, Func<ParameterExpression, Expression>> linqMappingsCache = new(typeof(T).GetProperties().Length);
    private string namePrefix = typeof(T).Name.ToLower();

    public MappingConfiguration(Dictionary<string, string> namesToProperties, string? prefix = null, bool forcePrecompile = false)
    {
        namePrefix = prefix ?? namePrefix;
        foreach (var property in typeof(T).GetProperties())
        {
            var snakeCasedProperty = property.Name.ToSnakeCase();
            snakeCasedProperty = string.IsNullOrEmpty(namePrefix) ? snakeCasedProperty : $"{namePrefix}.{snakeCasedProperty}";
            nameMappings[snakeCasedProperty] = property.Name;
            linqMappingsCache[snakeCasedProperty] = param => Expression.Property(param, property.Name);
        }
    }

    // public MappingConfiguration(Dictionary<string, Func<ParameterExpression, Expression>> namesToExpressions)
    // {

    // }

    // Note: Uses reflection, so it may be very slow.
    public object? GetPropertyByName(string name, T source)
    {
        if (source is not null && nameMappings.TryGetValue(name, out var accessor))
        {
            return source.GetType().GetProperty(accessor)?.GetValue(source);
        }
        return null;
    }

    // Returns a boolean indicating whether the property could be set successfully or not.
    // Note: Uses reflection, so it may be very slow.
    public void SetPropertyByName(string name, ref T source, object? value)
    {
        if (source is not null && nameMappings.TryGetValue(name, out var accessor))
        {
            source.GetType().GetProperty(accessor)?.SetValue(source, value);
        }
    }
}

// Adds extensions to the name mapping logic, specific to Entity Framework Core model classes.
public class EFCoreMappingConfiguration<T> : MappingConfiguration<T>
{
    public EFCoreMappingConfiguration(Dictionary<string, string> namesToProperties, string? prefix = null, bool forcePrecompile = false) : base(namesToProperties)
    {
        var result = new Dictionary<string, Func<ParameterExpression, Expression>>();
        var properties = typeof(T).GetProperties();
        foreach (var property in properties)
        {
            var propertyName = property.Name;
            // Normal properties, or a property just named "navigation" (case invariant) should be processed normally.
            if (!propertyName.EndsWith("Navigation") || propertyName.ToLower() == "Navigation")
            {
                propertyName = string.IsNullOrEmpty(prefix) ? propertyName.ToSnakeCase() : $"{prefix}.{propertyName.ToSnakeCase()}";
                result[propertyName] = param => Expression.Property(param, property.Name);
                continue;
            }
            // Implicit else: Properties with the "Navigation" suffix are
            // usually ORM tooling for foreign key/entity lookups in EF Core. We
            // indirect one level, and enumerate the non-Navigation properties
            // of that type.
            propertyName = property.Name[..^"Navigation".Length];
            propertyName = string.IsNullOrEmpty(prefix) ? propertyName.ToSnakeCase() : $"{prefix}.{propertyName.ToSnakeCase()}";

            Type memberType = property.PropertyType;
            var memberProperties = memberType.GetProperties();
            foreach (var memberProp in memberProperties)
            {
                // Skip cases like "Ticket.CustomerNavigation.TenantNavigation".
                if (memberProp.Name.EndsWith("Navigation") && memberProp.Name.ToLower() != "Navigation")
                {
                    continue;
                }
                var memberPropertyName = memberProp.Name.ToSnakeCase();
                result[$"{propertyName}.{memberPropertyName}"] = param => Expression.Property(Expression.Property(param, property.Name), memberPropertyName);
            }
        }
    }
}

public static class StringExtensions
{
    public static string ToSnakeCase(this string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return string.Concat(input.Select((x, i) => i > 0 && char.IsUpper(x) ? "_" + x.ToString() : x.ToString())).ToLower();
    }
}