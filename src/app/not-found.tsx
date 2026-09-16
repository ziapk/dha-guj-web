import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container not-found">
      <div style={{ fontSize: 56 }}>🏚️</div>
      <h1>We could not find that page</h1>
      <p>The listing may have been sold, rented or removed.</p>
      <Link className="btn btn-primary" href="/properties">
        Browse properties
      </Link>
    </div>
  );
}
