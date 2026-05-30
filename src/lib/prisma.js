"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_1 = require("../generated/prisma/client");
var globalForPrisma = global;
var adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
var prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        adapter: adapter,
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;
exports.default = prisma;
