
# mongoose-logging-plugin

[![npm version](https://img.shields.io/npm/v/mongoose-logging-plugin.svg)](https://www.npmjs.com/package/mongoose-logging-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The only comprehensive solution for tracking Mongoose database operations at the application level.**

mongoose-logging-plugin provides detailed logging and monitoring capabilities for all your Mongoose database operations. This library enables you to track queries, measure performance, and monitor memory usage, making it an invaluable tool for debugging, performance optimization, and monitoring in development and production environments.

With mongoose-logging-plugin, you can easily integrate your MongoDB operation logs with your preferred monitoring tools such as Grafana, Prometheus, Loki, Datadog, or any other logging service, giving you complete visibility into your database operations.

## Features

- 📊 Log pre and post query operations
- 💾 Log pre and post save operations
- ⏱️ Track query duration
- 🧠 Monitor application memory usage
- 🔒 Sanitize sensitive data in logs
- 🔍 Unique query IDs for tracking operations
- 🔧 Highly configurable
- 🧩 Simple integration with Mongoose

## Installation

```bash
npm install mongoose-logging-plugin
# or
yarn add mongoose-logging-plugin
```

## Quick Start

```javascript
const mongoose = require('mongoose');
const { initializeMongooseLogging } = require('mongoose-logging-plugin');

// Initialize the plugin with default configuration
initializeMongooseLogging(mongoose);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp');

// Define your schemas and models as usual
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);
```

## Usage

### Global Usage

To apply the plugin to all schemas:

```javascript
const mongoose = require('mongoose');
const { initializeMongooseLogging } = require('mongoose-logging-plugin');

// Initialize with custom configuration
initializeMongooseLogging(mongoose, {
    log_pre_query: true,
    log_post_query: true,
    log_pre_save: true,
    log_post_save: true,
    log_query_duration_ms: true,
    log_app_memory_usage: true,
    mask_values: true,
    custom_logger: console
});
```

### Per-Schema Usage

To apply the plugin to specific schemas:

```javascript
const mongoose = require('mongoose');
const { getMongooseLogPlugin } = require('mongoose-logging-plugin');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Apply the plugin to this schema only
userSchema.plugin(getMongooseLogPlugin({
    mask_values: false // Show all values for this schema
}));

const User = mongoose.model('User', userSchema);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log_pre_query` | boolean | `true` | Enable logging before query execution |
| `log_post_query` | boolean | `true` | Enable logging after query execution |
| `log_pre_save` | boolean | `true` | Enable logging before document save |
| `log_post_save` | boolean | `true` | Enable logging after document save |
| `log_query_duration_ms` | boolean | `true` | Track and log query execution time |
| `log_app_memory_usage` | boolean | `true` | Track and log application memory usage |
| `mask_values` | boolean | `true` | Sanitize sensitive values in logs |
| `custom_logger` | object | `console` | Custom logger implementation |

## Log Output Format

The plugin generates structured log objects with the following properties:

```typescript
type MongoLogChunkType = {
    query_id: string;        // Unique ID to identify query before and after execution
    collection: string;      // Collection/model name
    operation?: string;      // Operation type (find, findOne, deleteOne, save, etc.)
    type: 'pre' | 'post';    // Event type (pre or post)
    time: number;            // Timestamp of query (unix ms)
    query: any;              // Query filter object or save record input
    duration?: number;       // Query duration (only for post events)
    app_memory_usage?: {     // Memory usage statistics
        rss_mb: number;        // Resident Set Size in MB
        heap_used_mb: number;  // Heap used in MB
        heap_mb: number;       // Total heap size in MB
    };
};
```

## Custom Logger

You can provide your own logger implementation:

```javascript
const customLogger = {
    log: (logData) => {
        // Send to your logging service
        myLoggingService.send({
            type: 'mongodb_operation',
            timestamp: new Date(),
            data: logData
        });
    }
};

initializeMongooseLogging(mongoose, {
    custom_logger: customLogger
});
```

## Supported Operations

The plugin tracks the following Mongoose operations:

- `find`
- `findOne`
- `updateOne`
- `updateMany`
- `deleteOne`
- `deleteMany`
- `findOneAndUpdate`
- `aggregate`
- `save`

## Examples

### Basic Example

```javascript
// After initializing the plugin
const User = mongoose.model('User', userSchema);

// This query will be logged
const users = await User.find({ active: true });

// Console output will include:
// Pre-query log with query details
// Post-query log with duration and results
```

### Tracking Query Performance

```javascript
// Initialize with focus on performance metrics
initializeMongooseLogging(mongoose, {
    log_pre_query: false,  // Skip pre-query logs
    log_post_query: true,  // Only log completed queries
    log_query_duration_ms: true,
    log_app_memory_usage: true
});

// Run your queries as normal
const result = await User.findOne({ email: 'user@example.com' });

// Logs will include duration and memory usage
```

## Limitations and Considerations

- **Performance Impact**: This library adds hooks to Mongoose operations which can impact performance, especially when logging memory usage. Use with caution in production environments.

- **Memory Usage**: The library tracks memory usage which requires additional resources. Consider disabling this feature in memory-constrained environments.

- **Maintenance Status**: This library was developed quickly and may not receive extensive ongoing support. There may be edge cases and limitations not yet addressed.

- **Sensitive Data**: Database logs can contain sensitive information. Even with value masking enabled, be careful about how you store and process these logs.

- **Value Masking**: The default configuration masks values to protect sensitive data. Only disable masking when you are certain it's safe to do so.

- **Responsibility**: All responsibility for data handling and library usage lies solely with you. The author bears no responsibility for any issues arising from the use of this library.

## License

[MIT](LICENSE)

## Contributing

This is a small utility library with limited maintenance. Feel free to fork and adapt to your needs.

---

**Disclaimer**: This library may affect your application's startup time and memory usage. Use with caution in production environments. Database logs contain sensitive information - handle them carefully, especially when value masking is disabled. The author bears no responsibility for any issues arising from the use of this library.
