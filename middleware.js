import { next } from "@vercel/functions";

export const config = {
  matcher: "/"
};

export default function middleware(request) {
  var url = new URL(request.url);
  var sharedState = url.searchParams.get("q");

  if (!sharedState) return next();

  url.searchParams.delete("q");
  url.hash = "q=" + sharedState;

  return Response.redirect(url, 308);
}
