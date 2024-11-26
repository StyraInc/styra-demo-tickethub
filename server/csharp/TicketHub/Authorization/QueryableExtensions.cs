
using System.Linq.Expressions;

namespace TicketHub.Authorization;

public static class QueryableExtensions
{
    public static Expression UCASTToLINQ<T>(UCASTNode root, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var expression = BuildExpression<T>(root, parameter, mapper);
        return Expression.Lambda<Func<T, bool>>(expression, parameter);
    }

    // Builds a LINQ Lambda Expression from the UCAST tree, and then invokes it under a LINQ Where expression on some queryable source collection.
    // In our case, this *should* usually be an EF Core ORM model.
    public static IQueryable<T> ApplyUCASTFilter<T>(this IQueryable<T> source, UCASTNode root, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        var expression = BuildExpression<T>(root, parameter, mapper);
        return source.Where(Expression.Lambda<Func<T, bool>>(expression, parameter));
    }

    private static Expression BuildExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        // Switch expression:
        return node.Type.ToLower() switch
        {
            "field" => BuildFieldExpression<T>(node, parameter, mapper),
            "document" => BuildFieldExpression<T>(node, parameter, mapper), // TODO: Fix this to provide actual document-level operations.
            "compound" => BuildCompoundExpression<T>(node, parameter, mapper),
            _ => throw new ArgumentException($"Unknown node type: {node.Type}"),
        };
    }

    private static Expression BuildFieldExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        // TODO: Look up the FieldInfo that matches the string, slam it into the spot where it belongs.
        //var property = mapper[node.Field!];
        var property = mapper[node.Field!](parameter); // TODO: Replace with TryGet
        // Introspect the PropertyExpression, and extract the type of the thing the property is coming from.

        Expression value = Expression.Constant(node.Value); // TODO: Check that this reflects correctly.

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
            _ => throw new ArgumentException($"Unknown operation: {node.Op}"),
        };
    }

    private static Expression BuildCompoundExpression<T>(UCASTNode node, ParameterExpression parameter, Dictionary<string, Func<ParameterExpression, Expression>> mapper)
    {
        var childNodes = (List<UCASTNode>)node.Value;
        var childExpressions = childNodes.Select(child => BuildExpression<T>(child, parameter, mapper));

        // Switch expression:
        return node.Op.ToLower() switch
        {
            "and" => childExpressions.Aggregate(Expression.AndAlso),
            "or" => childExpressions.Aggregate(Expression.OrElse),
            _ => throw new ArgumentException($"Unknown group operation: {node.Op}"),
        };
    }
}