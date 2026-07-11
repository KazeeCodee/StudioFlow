import { type NextRequest, NextResponse } from "next/server";
import { requireMemberContext } from "@/modules/auth/queries";
import {
  BookingAvailabilityNotFoundError,
  getAvailableStartTimesForSpace,
} from "@/modules/bookings/queries";
import { bookingAvailabilityQuerySchema } from "@/modules/bookings/schema";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ spaceId: string }> },
) {
  await requireMemberContext();
  const { spaceId } = await context.params;
  const parsed = bookingAvailabilityQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    durationHours: request.nextUrl.searchParams.get("durationHours"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Consulta de disponibilidad invalida." },
      { status: 400 },
    );
  }

  try {
    const startTimes = await getAvailableStartTimesForSpace({
      spaceId,
      ...parsed.data,
    });
    return NextResponse.json({ startTimes });
  } catch (error) {
    if (error instanceof BookingAvailabilityNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}
