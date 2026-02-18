#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

if ! curl -sS -o /dev/null "${BASE_URL}"; then
  echo "Server is not reachable at ${BASE_URL}. Start the app and rerun."
  exit 1
fi

echo "1) Unauthenticated /profile should redirect to /login"
profile_headers="$(mktemp)"
curl -sS -D "${profile_headers}" -o /dev/null "${BASE_URL}/profile"
profile_status="$(awk 'NR==1 {print $2}' "${profile_headers}")"
profile_location="$(grep -i '^location:' "${profile_headers}" | head -n1 | cut -d' ' -f2- | tr -d '\r')"
if [[ "${profile_status}" != "307" && "${profile_status}" != "308" ]]; then
  echo "FAIL: expected 307/308, got ${profile_status}"
  rm -f "${profile_headers}"
  exit 1
fi
if [[ "${profile_location}" != /login* ]]; then
  echo "FAIL: expected Location to start with /login, got ${profile_location:-<empty>}"
  rm -f "${profile_headers}"
  exit 1
fi
echo "PASS"
rm -f "${profile_headers}"

echo "2) Unauthenticated /wishlist should remain guest-accessible"
wishlist_status="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/wishlist")"
if [[ "${wishlist_status}" != "200" ]]; then
  echo "FAIL: expected 200, got ${wishlist_status}"
  exit 1
fi
echo "PASS"

echo "3) /api/auth/logout should emit cookie-clearing headers for Supabase cookies"
logout_headers="$(mktemp)"
curl -sS -D "${logout_headers}" -o /dev/null -X POST "${BASE_URL}/api/auth/logout" -H 'Cookie: sb-fake=abc'
if ! grep -Eiq '^Set-Cookie: sb-.*(Expires=|Max-Age=0)' "${logout_headers}"; then
  echo "FAIL: expected Set-Cookie clear header for sb-* cookies"
  rm -f "${logout_headers}"
  exit 1
fi
echo "PASS"
rm -f "${logout_headers}"

echo "All auth smoke checks passed."
