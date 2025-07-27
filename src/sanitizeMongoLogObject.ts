type Primitive = string | number | boolean | Date | null | undefined;
type SanitizedValue = Primitive | { [key: string]: SanitizedValue } | SanitizedValue[];

function isObjectId(value: any): boolean {
  if (!value) {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(String(value));
}

export function sanitizeMongoLogObject(obj: any): { sanitized: SanitizedValue; replacements: Record<string, Primitive> } {
  const replacements: Record<string, Primitive> = {};
  let counter = 1;

  function processValue(value: any): SanitizedValue {
    if (value === null || value === undefined) {
      return value;
    }

    if (isObjectId(value)) {
      const placeholder = `$${counter++}`;
      const stringValue = value?.toHexString ? value.toHexString() : String(value);
      replacements[placeholder] = stringValue;
      return placeholder;
    }

    if (value instanceof Buffer) {
      const placeholder = `$${counter++}`;
      replacements[placeholder] = value.toString('hex');
      return placeholder;
    }

    if (value instanceof Date) {
      const placeholder = `$${counter++}`;
      replacements[placeholder] = value;
      return placeholder;
    }

    const type = typeof value;
    if (type === 'string') {
      const match = value.match(/^\$.*/);
      if (match) {
        return value;
      } else {
        const placeholder = `$${counter++}`;
        replacements[placeholder] = value;
        return placeholder;
      }
    }

    if (type === 'number' || type === 'boolean') {
      const placeholder = `$${counter++}`;
      replacements[placeholder] = value;
      return placeholder;
    }

    if (Array.isArray(value)) {
      return value.map(processValue);
    }

    if (type === 'object') {
      if (isObjectId(value) || value instanceof Buffer || value instanceof Date) {
        return processValue(value);
      }

      const result: Record<string, SanitizedValue> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = processValue(value[key]);
        }
      }
      return result;
    }

    return value;
  }

  return {
    sanitized: processValue(obj),
    replacements,
  };
}
