function validateSchema(schema, data) {
  for (const key in schema) {
    const rule = schema[key];

    if (rule.required && data[key] === undefined) {
      return `Missing required field: ${key}`;
    }

    if (data[key] !== undefined) {
      if (rule.type === "number" && typeof data[key] !== "number") {
        return `${key} must be a number`;
      }
      if (rule.type === "string" && typeof data[key] !== "string") {
        return `${key} must be a string`;
      }
      if (rule.type === "date" && isNaN(new Date(data[key]).getTime())) {
        return `${key} must be a valid date`;
      }
    }
  }
  return null;
}

module.exports = validateSchema;
