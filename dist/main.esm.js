// src/sanitizeMongoLogObject.ts
function isObjectId(value) {
  if (!value) {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(String(value));
}
function sanitizeMongoLogObject(obj) {
  const replacements = {};
  let counter = 1;
  function processValue(value) {
    if (value === null || value === void 0) {
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
      replacements[placeholder] = value.toString("hex");
      return placeholder;
    }
    if (value instanceof Date) {
      const placeholder = `$${counter++}`;
      replacements[placeholder] = value;
      return placeholder;
    }
    const type = typeof value;
    if (type === "string") {
      const match = value.match(/^\$.*/);
      if (match) {
        return value;
      } else {
        const placeholder = `$${counter++}`;
        replacements[placeholder] = value;
        return placeholder;
      }
    }
    if (type === "number" || type === "boolean") {
      const placeholder = `$${counter++}`;
      replacements[placeholder] = value;
      return placeholder;
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (type === "object") {
      if (isObjectId(value) || value instanceof Buffer || value instanceof Date) {
        return processValue(value);
      }
      const result = {};
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
    replacements
  };
}

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// src/initializeMongooseLogging.ts
var dbQueryMethods = ["find", "findOne", "updateOne", "updateMany", "deleteOne", "deleteMany", "findOneAndUpdate", "aggregate"];
var queryDurationMapStorage = /* @__PURE__ */ new Map();
var defaultMongoLogPluginInitConfig = {
  log_pre_query: true,
  log_post_query: true,
  log_post_save: true,
  log_pre_save: true,
  log_query_duration_ms: true,
  log_app_memory_usage: true,
  custom_logger: console,
  mask_values: true
};
function currentTimeString() {
  return (/* @__PURE__ */ new Date()).valueOf();
}
function getMemoryUsage() {
  const { rss, heapTotal, heapUsed } = process.memoryUsage();
  const heapUsedMB = Math.round(heapUsed / 1024 / 1024);
  const rssMb = rss / 1024 / 1024;
  const heapMb = heapTotal / 1024 / 1024;
  return {
    rss_mb: rssMb,
    heap_used_mb: heapUsedMB,
    heap_mb: heapMb
  };
}
function applySchemaSearchQueryHandler(config, schema, method, type) {
  schema?.[type](method, function(next) {
    let uniq_operation_id = "";
    if (type === "pre") {
      uniq_operation_id = v4_default();
      this.uniq_operation_id = uniq_operation_id;
    } else {
      uniq_operation_id = this.uniq_operation_id;
    }
    const this_ = this;
    const model_name = this_?.model?.modelName || "";
    const aggregate_model_name = this_._pipeline?.[0]?.$lookup?.from || this_?._pipeline?.[1]?.$graphLookup?.from || "";
    const final_model_name = model_name || aggregate_model_name;
    const operation = method;
    const conditions_raw = this_._conditions;
    const aggregation_pipeline_raw = this_._pipeline;
    const conditions_raw_final = conditions_raw || aggregation_pipeline_raw;
    const conditions_masked = config?.mask_values ? sanitizeMongoLogObject(conditions_raw_final).sanitized : conditions_raw_final;
    const time = currentTimeString();
    let duration = null;
    if (config?.log_query_duration_ms) {
      if (type === "pre") {
        queryDurationMapStorage.set(uniq_operation_id, time);
      }
      if (type === "post") {
        const time_from = queryDurationMapStorage.get(uniq_operation_id);
        if (time_from) {
          duration = time - time_from;
          queryDurationMapStorage.delete(uniq_operation_id);
        }
      }
    }
    if (config?.custom_logger?.log) {
      const log_metadata = {
        query_id: uniq_operation_id,
        //
        collection: final_model_name,
        operation,
        type,
        time,
        query: conditions_masked
      };
      if (duration !== null && type === "post") {
        log_metadata.duration = duration;
      }
      if (config?.log_app_memory_usage) {
        log_metadata.app_memory_usage = getMemoryUsage();
      }
      config?.custom_logger?.log(log_metadata);
    }
    if (type === "pre") {
      next();
    }
  });
}
function applySchemaSaveQueryHandler(config, schema, method, type) {
  schema?.[type](method, function(next) {
    const this_ = this;
    const model_name = schema?.options?.collection || "";
    const errors = this_?.$errors;
    const doc_raw = this_?._doc;
    const input_object = config?.mask_values ? sanitizeMongoLogObject(doc_raw).sanitized : doc_raw;
    const uniq_operation_id = `${model_name}::${method}::${doc_raw?._id || ""}`.slice(0, 500);
    const time = currentTimeString();
    if (config?.custom_logger?.log) {
      const log_metadata = {
        query_id: uniq_operation_id,
        //
        collection: model_name,
        type,
        time,
        query: input_object
      };
      let duration = null;
      if (config?.log_query_duration_ms) {
        if (type === "pre") {
          queryDurationMapStorage.set(uniq_operation_id, time);
        }
        if (type === "post") {
          const time_from = queryDurationMapStorage.get(uniq_operation_id);
          if (time_from) {
            duration = time - time_from;
            queryDurationMapStorage.delete(uniq_operation_id);
          }
        }
      }
      if (duration !== null && type === "post") {
        log_metadata.duration = duration;
      }
      if (config?.log_app_memory_usage) {
        log_metadata.app_memory_usage = getMemoryUsage();
      }
      config?.custom_logger?.log(log_metadata, errors);
    }
    if (type === "pre") {
      next();
    }
  });
}
var getMongooseLogPlugin = (config = {}) => {
  const finalConfig = {
    ...defaultMongoLogPluginInitConfig,
    ...config
  };
  const mongoLogPlugin = (schema) => {
    dbQueryMethods.forEach((method) => {
      if (config?.log_pre_query) {
        applySchemaSearchQueryHandler(finalConfig, schema, method, "pre");
      }
      if (config?.log_post_query) {
        applySchemaSearchQueryHandler(finalConfig, schema, method, "post");
      }
    });
    if (config?.log_pre_save) {
      applySchemaSaveQueryHandler(finalConfig, schema, "save", "pre");
    }
    if (config?.log_post_save) {
      applySchemaSaveQueryHandler(finalConfig, schema, "save", "post");
    }
  };
  return mongoLogPlugin;
};
async function initializeMongooseLogging(mongoose, config = {}) {
  const finalConfig = {
    ...defaultMongoLogPluginInitConfig,
    ...config
  };
  mongoose.plugin(getMongooseLogPlugin(finalConfig));
}
export {
  getMongooseLogPlugin,
  initializeMongooseLogging
};
