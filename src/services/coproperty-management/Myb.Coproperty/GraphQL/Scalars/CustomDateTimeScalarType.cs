using System;
using HotChocolate.Language;
using HotChocolate.Types;

namespace Myb.Coproperty.GraphQL.Scalars
{
    /// <summary>
    /// Custom DateTime scalar that accepts ISO 8601 formatted strings.
    /// Replaces the default DateTime scalar to support string parsing.
    /// </summary>
    public class CustomDateTimeScalarType : ScalarType
    {
        private const string TypingError =
            "DateTime cannot represent a non string, non integer and non date value.";

        public CustomDateTimeScalarType()
            : base("DateTime", BindingBehavior.Implicit)
        {
            Description = "DateTime in ISO 8601 format";
            Console.WriteLine("✅ CustomDateTimeScalarType INSTANTIATED!");
        }

        public override Type RuntimeType => typeof(DateTime);

        public override bool IsInstanceOfType(IValueNode valueSyntax)
        {
            return valueSyntax is StringValueNode or IntValueNode or NullValueNode;
        }

        /// <summary>
        /// ParseValue is called when converting a runtime DateTime value to GraphQL output.
        /// This returns a StringValueNode representation.
        /// </summary>
        public override IValueNode ParseValue(object? runtimeValue)
        {
            if (runtimeValue is DateTime dateTime)
            {
                return new StringValueNode(dateTime.ToString("O"));
            }
            else if (runtimeValue is string str)
            {
                // If a string is passed, try to parse it first
                if (DateTime.TryParse(str, out var dt))
                {
                    return new StringValueNode(dt.ToString("O"));
                }
                return new StringValueNode(str);
            }
            else if (runtimeValue is null)
            {
                return new NullValueNode(null);
            }

            throw new SerializationException(TypingError, this);
        }

        /// <summary>
        /// ParseLiteral is called when parsing a GraphQL query literal (e.g., a string in the query).
        /// This is the KEY method that needs to accept StringValueNode and convert to DateTime.
        /// </summary>
        public override object? ParseLiteral(IValueNode valueSyntax)
        {
            if (valueSyntax is StringValueNode sv)
            {
                // Try to parse the string value as DateTime
                if (DateTime.TryParse(sv.Value, out var dt))
                {
                    return dt;
                }
                // If parsing fails, just return the string and let the service handle validation
                return sv.Value;
            }
            else if (valueSyntax is IntValueNode iv)
            {
                // Support unix timestamps
                if (long.TryParse(iv.Value, out var timestamp))
                {
                    return DateTime.UnixEpoch.AddSeconds(timestamp);
                }
            }
            else if (valueSyntax is NullValueNode)
            {
                return null;
            }

            throw new SerializationException(TypingError, this);
        }

        /// <summary>
        /// Serializes a DateTime back to string for the response.
        /// </summary>
        public override object? Serialize(object? runtimeValue)
        {
            if (runtimeValue is DateTime dt)
            {
                return dt.ToString("O");
            }
            else if (runtimeValue is string str)
            {
                return str;
            }
            else if (runtimeValue is null)
            {
                return null;
            }

            throw new SerializationException(TypingError, this);
        }

        /// <summary>
        /// ParseResult is called to convert a result value back to a GraphQL value node.
        /// </summary>
        public override IValueNode ParseResult(object? resultValue)
        {
            if (resultValue is DateTime dt)
            {
                return new StringValueNode(dt.ToString("O"));
            }
            else if (resultValue is string str)
            {
                return new StringValueNode(str);
            }

            return new NullValueNode(null);
        }

        /// <summary>
        /// Tries to deserialize a result value to DateTime.
        /// </summary>
        public override bool TryDeserialize(object? resultValue, out object? deserializedValue)
        {
            if (resultValue is DateTime dt)
            {
                deserializedValue = dt;
                return true;
            }
            else if (resultValue is string str)
            {
                if (DateTime.TryParse(str, out var parsedDt))
                {
                    deserializedValue = parsedDt;
                    return true;
                }
            }
            else if (resultValue is null)
            {
                deserializedValue = null;
                return true;
            }

            deserializedValue = null;
            return false;
        }

        /// <summary>
        /// Tries to serialize a runtime value to output format.
        /// </summary>
        public override bool TrySerialize(object? runtimeValue, out object? resultValue)
        {
            if (runtimeValue is DateTime dt)
            {
                resultValue = dt.ToString("O");
                return true;
            }
            else if (runtimeValue is string str)
            {
                resultValue = str;
                return true;
            }
            else if (runtimeValue is null)
            {
                resultValue = null;
                return true;
            }

            resultValue = null;
            return false;
        }
    }
}
