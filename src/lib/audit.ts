import prisma from "@/lib/prisma";
import { AuditAction } from "@/generated/prisma/enums";
import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";

interface AuditOptions {
  actorId?: string;          // null for system events
  action: AuditAction;
  entity: string;            // model name e.g. "Property"
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  req?: NextRequest;
}

/*
  Shared helper — write an immutable audit log entry.
  Fire-and-forget: errors are swallowed so they never break the main request.
*/
export async function audit(opts: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        before: opts.before ?? Prisma.JsonNull,
        after: opts.after ?? Prisma.JsonNull,
        ipAddress: opts.req
          ? (opts.req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
             opts.req.headers.get("x-real-ip") ??
             null)
          : null,
        userAgent: opts.req?.headers.get("user-agent") ?? null,
      },
    });
  } catch {
    console.error("[audit] Failed to write audit log:", {
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
    });
  }
}
