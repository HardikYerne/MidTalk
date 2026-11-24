# Scaling

The API is a modular monolith. Socket.IO can use the Redis adapter when Redis is available. MongoDB indexes and object storage are configured in their respective adapters. Any concurrency or throughput target remains unvalidated until representative load tests are run.
