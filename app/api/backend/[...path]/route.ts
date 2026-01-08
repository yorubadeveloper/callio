import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE_URL = process.env.API_URL || "http://localhost:8000/api/v1";
const API_KEY = process.env.API_KEY || "";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  // Check authentication (optional - you can make some routes public)
  const session = await auth();
  if (!session && !isPublicRoute(params.path)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build backend URL
  const path = params.path.join("/");
  const url = new URL(`${API_BASE_URL}/${path}`);

  // Copy query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
  };

  // Add body for POST/PUT requests
  if (method === "POST" || method === "PUT") {
    try {
      const body = await request.json();
      options.body = JSON.stringify(body);
    } catch {
      // No body or invalid JSON
    }
  }

  try {
    // Forward request to backend
    const response = await fetch(url.toString(), options);

    // Get response data
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Return response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Backend proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}

function isPublicRoute(path: string[]): boolean {
  // Define public routes that don't require authentication
  const publicRoutes = ["health"];
  return publicRoutes.includes(path[0]);
}
