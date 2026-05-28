import { next } from "@vercel/functions";

export const config = {
  matcher: "/"
};

export default function middleware(request) {
  return next();
}
