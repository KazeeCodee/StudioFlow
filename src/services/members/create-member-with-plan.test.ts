import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs, memberPlans, members, profiles } from "@/lib/db/schema";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));

import {
  calculateInitialQuota,
  createMemberWithPlan,
} from "@/services/members/create-member-with-plan";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("create-member-with-plan", () => {
  it("usa los cupos del plan como cuota inicial", () => {
    expect(calculateInitialQuota({ quotaAmount: 12 })).toBe(12);
  });

  it("crea el miembro sin consultar ni insertar un plan cuando no fue asignado", async () => {
    const insertedTables: unknown[] = [];
    const insertedValues: Array<{ table: unknown; values: Record<string, unknown> }> = [];
    const insert = vi.fn((table: unknown) => {
      insertedTables.push(table);

      return {
        values: vi.fn((values: Record<string, unknown>) => {
          insertedValues.push({ table, values });

          if (table === auditLogs) {
            return Promise.resolve();
          }

          const rows = table === profiles
            ? [{ id: "profile-1", email: "ana@example.com", fullName: "Ana Pérez" }]
            : table === members
              ? [{ id: "member-1", fullName: "Ana Pérez" }]
              : [{ id: "member-plan-1" }];

          return {
            returning: vi.fn().mockResolvedValue(rows),
          };
        }),
      };
    });
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      transaction: vi.fn(async (callback: (tx: { insert: typeof insert }) => unknown) => (
        callback({ insert })
      )),
    };
    const adminClient = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "profile-1" } },
            error: null,
          }),
          deleteUser: vi.fn(),
        },
      },
    };
    mocks.getDb.mockReturnValue(db);
    mocks.createSupabaseAdminClient.mockReturnValue(adminClient);

    const result = await createMemberWithPlan(
      {
        fullName: "Ana Pérez",
        email: "ana@example.com",
        password: "password-segura",
        status: "active",
      },
      {
        id: "staff-1",
        email: "staff@example.com",
        fullName: "Staff Uno",
        role: "admin",
        status: "active",
      },
    );

    expect(db.select).not.toHaveBeenCalled();
    expect(insertedTables).not.toContain(memberPlans);
    expect(result).toEqual({ memberId: "member-1", memberPlanId: null });
    expect(insertedValues.find(({ table }) => table === auditLogs)?.values.metadata).toEqual({
      memberName: "Ana Pérez",
      planId: null,
      memberPlanId: null,
    });
  });
});
