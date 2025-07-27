type Primitive = string | number | boolean | Date | null | undefined;
type SanitizedValue = Primitive | {
    [key: string]: SanitizedValue;
} | SanitizedValue[];
export declare function sanitizeMongoLogObject(obj: any): {
    sanitized: SanitizedValue;
    replacements: Record<string, Primitive>;
};
export {};
