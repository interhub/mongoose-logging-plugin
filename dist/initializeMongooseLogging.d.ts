type MongoLogPluginInitConfig = {
    log_pre_query: boolean;
    log_post_query: boolean;
    log_pre_save: boolean;
    log_post_save: boolean;
    log_query_duration_ms: boolean;
    log_app_memory_usage: boolean;
    mask_values: boolean;
    custom_logger: any;
};
export declare const getMongooseLogPlugin: (config?: Partial<MongoLogPluginInitConfig>) => (schema: any) => void;
export declare function initializeMongooseLogging(mongoose: any, config?: Partial<MongoLogPluginInitConfig>): Promise<void>;
export {};
