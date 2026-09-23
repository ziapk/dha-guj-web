import type { Metadata } from "next";
import Link from "next/link";
import { AgentCard } from "@/components/home/agent-card";
import { SectionHeading } from "@/components/home/section-heading";
import { getAgents } from "@/lib/agents";
import { openGraph } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-data";

export const revalidate = 300;

const TITLE = "Our agents";
const DESCRIPTION = "Trusted real estate professionals in DHA Gujranwala. Call or WhatsApp an agent about plots, files, houses and commercial property.";

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);

  return Number.isInteger(page) && page > 1 ? page : 1;
}

export async function generateMetadata({ searchParams }: PageProps<"/agents">): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  const title = page > 1 ? `${TITLE} — page ${page}` : TITLE;

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: page > 1 ? `/agents?page=${page}` : "/agents" },
    openGraph: await openGraph({ title, description: DESCRIPTION, url: "/agents" }),
  };
}

export default async function AgentsPage({ searchParams }: PageProps<"/agents">) {
  const page = pageNumber((await searchParams).page);
  const [settings, agents] = await Promise.all([getSiteSettings(), getAgents(page)]);
  const lastPage = agents?.meta.last_page ?? 1;

  return (
    <section className="section">
      <div className="container">
        <SectionHeading title="Our" highlight="Agents" subtitle={DESCRIPTION} />

        {!agents || agents.data.length === 0 ? (
          <div className="empty-results">
            <p>No agents to show yet. Check back soon, or browse our dealers.</p>
            <Link className="btn btn-outline" href="/agencies">
              View dealers
            </Link>
          </div>
        ) : (
          <>
            <div className="agent-grid">
              {agents.data.map((agent) => (
                <AgentCard key={agent.id} agent={agent} fallbackPhone={settings.contact.phone} fallbackWhatsapp={settings.contact.whatsapp} />
              ))}
            </div>

            {lastPage > 1 && (
              <nav className="simple-pagination" aria-label="Pagination">
                {page > 1 ? <Link href={`/agents?page=${page - 1}`}>← Previous</Link> : <span />}
                <span>
                  Page {page} of {lastPage}
                </span>
                {page < lastPage ? <Link href={`/agents?page=${page + 1}`}>Next →</Link> : <span />}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
