import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { apiError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const result = await getCatalog({
      search: params.get("search") || undefined,
      category: params.get("category") || undefined,
      sort: params.get("sort") || undefined,
      page: Number(params.get("page") || 1),
      limit: Number(params.get("limit") || 10),
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) { return apiError(error); }
}
