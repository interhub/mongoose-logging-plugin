import { sanitizeMongoLogObject } from './sanitizeMongoLogObject';
import { v4 } from 'uuid';

const dbQueryMethods = ['find', 'findOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'aggregate'];
const queryDurationMapStorage = new Map<string, number>();

type MongoLogChunkType = {
  query_id: string; // uniq string generated on library code side to identify query before and after query.
  collection: string; //collection name | model name
  operation?: string; // find | findOne | deleteOne| save , etc
  type: 'pre' | 'post'; //pre or post event type
  time: number; //timestamp of a query unix in ms
  query: any; //save record input or query filter object
  duration?: number; //only for post events (post save post query)
  app_memory_usage?: {
    rss_mb: number;
    heap_used_mb: number;
    heap_mb: number;
  };
};

type MongoLogPluginInitConfig = {
  log_pre_query: boolean; // default true
  log_post_query: boolean; //default true
  log_pre_save: boolean; //default true
  log_post_save: boolean; //default true
  log_query_duration_ms: boolean; // default true
  log_app_memory_usage: boolean; // default true
  mask_values: boolean; // default true // change it to see all query variables (not safe)
  custom_logger: any; // default console object
  disable_all: boolean; // default false
};

const defaultMongoLogPluginInitConfig: MongoLogPluginInitConfig = {
  log_pre_query: true,
  log_post_query: true,
  log_post_save: true,
  log_pre_save: true,
  log_query_duration_ms: true,
  log_app_memory_usage: true,
  custom_logger: console,
  mask_values: true,
  disable_all: false,
};

function currentTimeString() {
  return new Date().valueOf();
}

function getMemoryUsage() {
  const { rss, heapTotal, heapUsed } = process.memoryUsage();
  const heapUsedMB = Math.round(heapUsed / 1024 / 1024);
  const rssMb = rss / 1024 / 1024;
  const heapMb = heapTotal / 1024 / 1024;
  return {
    rss_mb: rssMb,
    heap_used_mb: heapUsedMB,
    heap_mb: heapMb,
  };
}

function applySchemaSearchQueryHandler(config: MongoLogPluginInitConfig, schema: any, method: string, type: 'pre' | 'post') {
  if (!!config?.disable_all) {
    return;
  }

  schema?.[type](method, function (next: any) {
    let uniq_operation_id = '';
    if (type === 'pre') {
      uniq_operation_id = v4();
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      this.uniq_operation_id = uniq_operation_id;
    } else {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      uniq_operation_id = this.uniq_operation_id;
    }

    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const this_ = this as any;
    //model collection name
    const model_name = this_?.model?.modelName || '';
    const aggregate_model_name = this_._pipeline?.[0]?.$lookup?.from || this_?._pipeline?.[1]?.$graphLookup?.from || '';
    const final_model_name = model_name || aggregate_model_name;
    //operation . method name
    const operation = method;
    //the condition input of an operation
    const conditions_raw = this_._conditions;
    const aggregation_pipeline_raw = this_._pipeline;
    const conditions_raw_final = conditions_raw || aggregation_pipeline_raw;
    const conditions_masked = config?.mask_values ? sanitizeMongoLogObject(conditions_raw_final).sanitized : conditions_raw_final;
    // const condition_string = JSON.stringify(conditions_masked || {});
    // const operation_id = `${final_model_name}::${operation}::${condition_string}`.slice(0, 500);

    const time = currentTimeString();
    let duration: null | number = null;

    if (config?.log_query_duration_ms) {
      if (type === 'pre') {
        queryDurationMapStorage.set(uniq_operation_id, time);
      }
      if (type === 'post') {
        const time_from = queryDurationMapStorage.get(uniq_operation_id);
        if (time_from) {
          duration = time - time_from;
          queryDurationMapStorage.delete(uniq_operation_id);
        }
      }
    }

    if (config?.custom_logger?.log) {
      const log_metadata: MongoLogChunkType = {
        query_id: uniq_operation_id, //
        collection: final_model_name,
        operation,
        type,
        time,
        query: conditions_masked,
      };
      if (duration !== null && type === 'post') {
        log_metadata.duration = duration;
      }
      if (config?.log_app_memory_usage) {
        log_metadata.app_memory_usage = getMemoryUsage();
      }

      if (type === 'pre' && config?.log_pre_query) {
        config?.custom_logger?.log(log_metadata);
      }
      if (type === 'post' && config?.log_post_query) {
        config?.custom_logger?.log(log_metadata);
      }
    }

    if (type === 'pre') {
      next();
    }
  });
}

function applySchemaSaveQueryHandler(config: MongoLogPluginInitConfig, schema: any, method: 'save', type: 'pre' | 'post') {
  if (!!config?.disable_all) {
    return;
  }

  schema?.[type](method, function (next: any) {
    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const this_ = this as any;

    const model_name = schema?.options?.collection || '';
    const errors = this_?.$errors;
    const doc_raw = this_?._doc;
    const input_object = config?.mask_values ? sanitizeMongoLogObject(doc_raw).sanitized : doc_raw;

    const uniq_operation_id = `${model_name}::${method}::${doc_raw?._id || ''}`.slice(0, 500);
    const time = currentTimeString();

    if (config?.custom_logger?.log) {
      const log_metadata: MongoLogChunkType = {
        query_id: uniq_operation_id, //
        collection: model_name,
        operation: method,
        type,
        time,
        query: input_object,
      };
      let duration: null | number = null;

      if (config?.log_query_duration_ms) {
        if (type === 'pre') {
          queryDurationMapStorage.set(uniq_operation_id, time);
        }
        if (type === 'post') {
          const time_from = queryDurationMapStorage.get(uniq_operation_id);
          if (time_from) {
            duration = time - time_from;
            queryDurationMapStorage.delete(uniq_operation_id);
          }
        }
      }

      if (duration !== null && type === 'post') {
        log_metadata.duration = duration;
      }
      if (config?.log_app_memory_usage) {
        log_metadata.app_memory_usage = getMemoryUsage();
      }

      if (type === 'pre' && config?.log_pre_save) {
        config?.custom_logger?.log(log_metadata, errors);
      }
      if (type === 'post' && config?.log_post_save) {
        config?.custom_logger?.log(log_metadata, errors);
      }
    }

    if (type === 'pre') {
      next();
    }
  });
}

//for global audience usage and applying on users side
export const getMongooseLogPlugin = (config: Partial<MongoLogPluginInitConfig> = {}) => {
  const finalConfig = {
    ...defaultMongoLogPluginInitConfig,
    ...config,
  };

  const mongoLogPlugin = (schema: any) => {
    dbQueryMethods.forEach((method) => {
      applySchemaSearchQueryHandler(finalConfig, schema, method, 'pre');
      applySchemaSearchQueryHandler(finalConfig, schema, method, 'post');
    });
    applySchemaSaveQueryHandler(finalConfig, schema, 'save', 'pre');
    applySchemaSaveQueryHandler(finalConfig, schema, 'save', 'post');
  };

  return mongoLogPlugin;
};

export async function initializeMongooseLogging(mongoose: any, config: Partial<MongoLogPluginInitConfig> = {}) {
  // optionally add custom configuration eg:
  const finalConfig = {
    ...defaultMongoLogPluginInitConfig,
    ...config,
  };
  mongoose.plugin(getMongooseLogPlugin(finalConfig));
}
