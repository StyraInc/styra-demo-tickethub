
using System.Linq.Expressions;

namespace TicketHub.Authorization;

public static class QueryableExtensions
{
    /// <summary>
    /// Builds a LINQ Lambda Expression from the UCAST tree, and then invokes
    /// it under a LINQ Where expression on some queryable data source.
    /// In our case, this *should* usually be an EF Core ORM model.
    /// </summary>
    /// <param name="source">LINQ data source (same type as <typeparamref name="T"/>).</param>
    /// <param name="root">The top-level UCAST node to build a LINQ Expression tree from.</param>
    /// <param name="mapper">Dictionary mapping UCAST property names to lambdas that generate LINQ Expressions.</param>
    /// <returns>Result, an IQueryable<<typeparamref name="T"/>>.</returns>
    public static IQueryable<T> ApplyUCASTFilter<T>(this IQueryable<T> source, UCASTNode root, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var expression = BuildExpression<T>(root, parameter, mapper);
        return source.Where(Expression.Lambda<Func<T, bool>>(expression, parameter));
    }

    /// <summary>
    /// The entry point for recursively constructing a LINQ Expression tree
    /// from a given UCASTNode.
    /// </summary>
    /// <param name="node">Current UCAST node in the conditions tree.</param>
    /// <param name="parameter">LINQ data source (same type as <typeparamref name="T"/>).</param>
    /// <param name="mapper">Dictionary mapping UCAST property names to lambdas that generate LINQ Expressions.</param>
    /// <returns>Result, a LINQ Expression.</returns>
    public static Expression BuildExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        // Switch expression:
        return node.Type.ToLower() switch
        {
            "field" => BuildFieldExpression<T>(node, parameter, mapper),
            "document" => BuildFieldExpression<T>(node, parameter, mapper), // TODO: Fix this to provide actual document-level operations once we have any.
            "compound" => BuildCompoundExpression<T>(node, parameter, mapper),
            _ => throw new ArgumentException($"Unknown node type: {node.Type}"),
        };
    }

    /// <summary>
    /// Constructs a field-level UCAST condition using LINQ Expressions. Most
    /// operators of interest in UCAST field-level conditionsare represented
    /// as BinaryExpression types. Some typecasts (such as Int32 upcasting to
    /// Int64) are detected and included in the LINQ Expression tree
    /// automatically, to ensure that the binary expressions won't fail at
    /// runtime due to type mismatches between operands.
    /// </summary>
    /// <param name="node">Current UCAST node in the conditions tree.</param>
    /// <param name="parameter">LINQ data source (same type as <typeparamref name="T"/>).</param>
    /// <param name="mapper">Dictionary mapping UCAST property names to lambdas that generate LINQ Expressions.</param>
    /// <returns>Result, a LINQ Expression (Usually a BinaryExpression).</returns>
    private static Expression BuildFieldExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var property = mapper[node.Field!](parameter); // Note: This will throw a KeyNotFoundException if the field name does not exist.
        Expression value = Expression.Constant(node.Value);

        Type lhsType = property.Type;
        Type rhsType = value.Type;
        if (lhsType != rhsType)
        {
            // Upcast smaller numeric type from System.Int32 -> System.Int64.
            if (lhsType == typeof(int) && rhsType == typeof(long))
            {
                property = Expression.Convert(property, typeof(long));
            }
            else if (lhsType == typeof(long) && rhsType == typeof(int))
            {
                value = Expression.Convert(value, typeof(long));
            }
        }

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
            _ => throw new ArgumentException($"Unknown operator: {node.Op}"),
        };
    }

    /// <summary>
    /// Constructs a compound UCAST condition. Recursively constructs its child
    /// conditions, then binds the child nodes together with a LINQ aggregate
    /// operation.
    /// </summary>
    /// <param name="node">Current UCAST node in the conditions tree.</param>
    /// <param name="parameter">LINQ data source (same type as <typeparamref name="T"/>).</param>
    /// <param name="mapper">Dictionary mapping UCAST property names to lambdas that generate LINQ Expressions.</param>
    /// <returns>Result, an aggregate LINQ Expression.</returns>
    private static Expression BuildCompoundExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var childNodes = (List<UCASTNode>)node.Value;
        var childExpressions = childNodes.Select(child => BuildExpression<T>(child, parameter, mapper));

        // Switch expression:
        return node.Op.ToLower() switch
        {
            "and" => childExpressions.Aggregate(Expression.AndAlso),
            "or" => childExpressions.Aggregate(Expression.OrElse),
            _ => throw new ArgumentException($"Unknown compound operator: {node.Op}"),
        };
    }

    /// <summary>
    /// BuildDefaultMapperDictionary constructs a Dictionary mapping UCAST
    /// property names to lambda functions. The lambda functions allow
    /// late-binding a LINQ data source into LINQ Property expression lookups,
    /// which are used extensively when building conditions over EF Core models.
    ///
    /// When deciding on names for data source properties, we follow a small set
    /// of default construction rules:
    ///  - Example.Id -> "example.id"
    ///  - Example.LastUpdated -> "example.last_updated"
    ///  - Example.UserNavigation.Id -> "example.user.id"
    /// </summary>
    /// <param name="prefix">Name of the LINQ data source, as it will appear in UCAST field references. Used as a prefix for the generated property mappings.</param>
    /// <returns>Result, a Dictionary.</returns>
    public static Dictionary<string, Func<ParameterExpression, Expression>> BuildDefaultMapperDictionary<T>(string prefix = "")
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

        return result;
    }

    private static string ToSnakeCase(this string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return string.Concat(input.Select((x, i) => i > 0 && char.IsUpper(x) ? "_" + x.ToString() : x.ToString())).ToLower();
    }
}
