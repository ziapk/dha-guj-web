"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, ChevronRightIcon, LayersIcon, MapIcon, PinIcon, SearchIcon, ShareIcon, WhatsAppIcon } from "@/components/icons";
import { AREA_UNIT_LABELS, formatCompactPrice } from "@/lib/labels";
import { PLOT_TYPES, areaTitle, blockName, mapsHref, sectorEntries, sectorName, type SectorEntry } from "@/lib/plot-finder-shared";
import { coverOf, propertyHref, thumbnailUrl } from "@/lib/property";
import type { MapAreas, MapBlock, MapConfig, PlotDetail, PlotSearchResult } from "@/types/api";
import type { MapFocus } from "./plot-map";

const PlotMap = dynamic(() => import("./plot-map"), { ssr: false, loading: () => <div className="plot-map is-loading" aria-hidden="true" /> });

type Props = {
  config: MapConfig;
  areas: MapAreas;
  initialSectorId: number | null;
  initialBlockId: number | null;
  initialPlotId: number | null;
  whatsapp: string | null;
  postPropertyUrl: string;
};

async function fetchPlot(id: number): Promise<PlotDetail | null> {
  try {
    const response = await fetch(`/api/map/plots/${id}`);

    return response.ok ? ((await response.json()) as { data: PlotDetail }).data : null;
  } catch {
    return null;
  }
}

export function PlotFinder({ config, areas, initialSectorId, initialBlockId, initialPlotId, whatsapp, postPropertyUrl }: Props) {
  const entries = useMemo(() => sectorEntries(areas), [areas]);
  const [sectorId, setSectorId] = useState(initialSectorId);
  const [blockId, setBlockId] = useState(initialBlockId);
  const [focus, setFocus] = useState<MapFocus>({ sectorId: initialSectorId, blockId: initialBlockId, nonce: initialSectorId ? 1 : 0 });
  const [baseLayer, setBaseLayer] = useState<"satellite" | "streets">("satellite");
  const [showOverlays, setShowOverlays] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(areas.overlays[0]?.opacity ?? 70);
  const [locateNonce, setLocateNonce] = useState(0);
  const [status, setStatus] = useState({ loading: false, truncated: false, zoomedOut: true });
  const [plot, setPlot] = useState<PlotDetail | null>(null);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<{ geometry: PlotDetail["geometry"]; nonce: number } | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  const entry = entries.find((item) => item.sector.id === sectorId) ?? null;
  const block = entry?.sector.blocks.find((item) => item.id === blockId) ?? null;
  const title = areaTitle(entry, block);

  /** Keep the address bar on the area and plot shown, without reloading the page. */
  const syncUrl = useCallback((nextEntry: SectorEntry | null, nextBlock: MapBlock | null, plotId: number | null, push: boolean) => {
    const url = mapsHref(nextEntry, nextBlock) + (plotId ? `?plot=${plotId}` : "");

    if (url !== window.location.pathname + window.location.search) {
      window.history[push ? "pushState" : "replaceState"](null, "", url);
    }
  }, []);

  const selectArea = useCallback(
    (nextSectorId: number | null, nextBlockId: number | null) => {
      const nextEntry = entries.find((item) => item.sector.id === nextSectorId) ?? null;
      const nextBlock = nextEntry?.sector.blocks.find((item) => item.id === nextBlockId) ?? null;
      setSectorId(nextEntry?.sector.id ?? null);
      setBlockId(nextBlock?.id ?? null);
      setPlot(null);
      setHighlight(null);
      setFocus((current) => ({ sectorId: nextEntry?.sector.id ?? null, blockId: nextBlock?.id ?? null, nonce: current.nonce + 1 }));
      syncUrl(nextEntry, nextBlock, null, true);
    },
    [entries, syncUrl],
  );

  const showPlot = useCallback(
    (data: PlotDetail | null) => {
      if (!data) {
        setPlotError("This plot could not be loaded. Please try again.");

        return;
      }

      const nextEntry = entries.find((item) => item.sector.id === data.sector_id) ?? null;
      const nextBlock = nextEntry?.sector.blocks.find((item) => item.id === data.block_id) ?? null;
      setPlotError(null);
      setPlot(data);
      setSectorId(data.sector_id);
      setBlockId(data.block_id);
      setHighlight((current) => ({ geometry: data.geometry, nonce: (current?.nonce ?? 0) + 1 }));
      syncUrl(nextEntry, nextBlock, data.id, false);
    },
    [entries, syncUrl],
  );

  const selectPlot = useCallback((id: number) => fetchPlot(id).then(showPlot), [showPlot]);

  // A shared link with ?plot= opens that plot.
  useEffect(() => {
    if (initialPlotId) {
      fetchPlot(initialPlotId).then(showPlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first load
  }, []);

  // Back / forward between areas.
  useEffect(() => {
    const onPop = () => {
      const [key, blockSlug] = window.location.pathname.replace(/^\/maps\/?/, "").split("/").filter(Boolean);
      const nextEntry = entries.find((item) => item.key === key) ?? null;
      const nextBlock = nextEntry?.sector.blocks.find((item) => item.slug === blockSlug) ?? null;
      setSectorId(nextEntry?.sector.id ?? null);
      setBlockId(nextBlock?.id ?? null);
      setPlot(null);
      setHighlight(null);
      setFocus((current) => ({ sectorId: nextEntry?.sector.id ?? null, blockId: nextBlock?.id ?? null, nonce: current.nonce + 1 }));
    };

    window.addEventListener("popstate", onPop);

    return () => window.removeEventListener("popstate", onPop);
  }, [entries]);

  const closePlot = () => {
    setPlot(null);
    setHighlight(null);
    syncUrl(entry, block, null, false);
  };

  const hasAreas = entries.length > 0;

  return (
    <div className="plot-finder">
      <aside className="pf-panel" aria-label="Plot Finder">
        <div className="pf-panel-head">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">›</span>
            {entry ? (
              <button type="button" className="pf-crumb" onClick={() => selectArea(null, null)}>
                Maps
              </button>
            ) : (
              <span aria-current="page">Maps</span>
            )}
            {entry && (
              <>
                <span aria-hidden="true">›</span>
                <span aria-current={block ? undefined : "page"}>{sectorName(entry.sector.name)}</span>
              </>
            )}
            {block && (
              <>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{blockName(block.name)}</span>
              </>
            )}
          </nav>
          <h1>
            {title} <span>Plot Finder</span>
          </h1>
          <PlotSearch onPick={(result) => void selectPlot(result.id)} />
        </div>

        <div className="pf-panel-body">
          {plotError && <p className="pf-error">{plotError}</p>}

          {plot ? (
            <PlotDetails plot={plot} whatsapp={whatsapp} postPropertyUrl={postPropertyUrl} onBack={closePlot} />
          ) : !hasAreas ? (
            <div className="pf-empty">
              <MapIcon className="icon" />
              <h2>Plot maps are coming soon</h2>
              <p>We are mapping DHA Gujranwala sector by sector. Meanwhile, explore the satellite view or browse plots for sale.</p>
              <Link className="btn btn-primary" href="/properties?category=plot">
                Browse plots
              </Link>
            </div>
          ) : (
            <AreaList entries={entries} sectorId={sectorId} blockId={blockId} onSelect={selectArea} />
          )}
        </div>
      </aside>

      <div className="pf-map-wrap">
        <PlotMap
          config={config}
          areas={areas}
          baseLayer={baseLayer}
          showOverlays={showOverlays}
          overlayOpacity={overlayOpacity}
          focus={focus}
          highlight={highlight}
          locateNonce={locateNonce}
          onSelectPlot={(id) => void selectPlot(id)}
          onSelectArea={(nextSector, nextBlock) => {
            if (nextSector !== sectorId || nextBlock !== blockId) {
              selectArea(nextSector, nextBlock);
            }
          }}
          onStatus={setStatus}
        />

        <div className="pf-controls">
          <div className="pf-segmented" role="group" aria-label="Map type">
            {config.layers.map((layer) => (
              <button key={layer.key} type="button" aria-pressed={baseLayer === layer.key} onClick={() => setBaseLayer(layer.key)}>
                {layer.label}
              </button>
            ))}
          </div>

          {areas.overlays.length > 0 && (
            <div className="pf-card pf-overlay-control">
              <label className="pf-check">
                <input type="checkbox" checked={showOverlays} onChange={(event) => setShowOverlays(event.target.checked)} />
                Society map
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={overlayOpacity}
                disabled={!showOverlays}
                onChange={(event) => setOverlayOpacity(Number(event.target.value))}
                aria-label="Society map opacity"
              />
            </div>
          )}

          <button type="button" className="pf-icon-btn" onClick={() => setLocateNonce((value) => value + 1)} aria-label="Show my location" title="My location">
            <PinIcon className="icon" />
          </button>
          <button type="button" className="pf-icon-btn" onClick={() => setLegendOpen((open) => !open)} aria-expanded={legendOpen} aria-label="Legend" title="Legend">
            <LayersIcon className="icon" />
          </button>
        </div>

        {legendOpen && (
          <div className="pf-card pf-legend">
            <strong>Legend</strong>
            <ul>
              {Object.entries(PLOT_TYPES).map(([key, type]) => (
                <li key={key}>
                  <span style={{ background: type.color }} aria-hidden="true" />
                  {type.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasAreas && (status.zoomedOut || status.loading || status.truncated) && (
          <p className="pf-status" role="status">
            {status.loading ? "Loading plots…" : status.truncated ? "Zoom in to see every plot" : "Zoom in to see plots"}
          </p>
        )}
      </div>
    </div>
  );
}

function AreaList({ entries, sectorId, blockId, onSelect }: { entries: SectorEntry[]; sectorId: number | null; blockId: number | null; onSelect: (sectorId: number | null, blockId: number | null) => void }) {
  const groups = new Map<string, SectorEntry[]>();

  for (const item of entries) {
    const label = `${item.society.name} · Phase ${item.phase.name}`;
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return (
    <div className="pf-areas">
      {[...groups.entries()].map(([label, items]) => (
        <section key={label}>
          <h2>{label}</h2>
          <ul>
            {items.map((item) => {
              const open = item.sector.id === sectorId;

              return (
                <li key={item.sector.id} className={open ? "is-open" : undefined}>
                  <a
                    href={mapsHref(item)}
                    className={open && blockId === null ? "is-active" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      onSelect(item.sector.id, null);
                    }}
                  >
                    <span>{sectorName(item.sector.name)}</span>
                    <small>{item.sector.plots_count.toLocaleString("en-PK")} plots</small>
                    <ChevronRightIcon className="icon" />
                  </a>
                  {open && item.sector.blocks.length > 0 && (
                    <ul className="pf-blocks">
                      {item.sector.blocks.map((block) => (
                        <li key={block.id}>
                          <a
                            href={mapsHref(item, block)}
                            className={blockId === block.id ? "is-active" : undefined}
                            onClick={(event) => {
                              event.preventDefault();
                              onSelect(item.sector.id, block.id);
                            }}
                          >
                            <span>{blockName(block.name)}</span>
                            <small>{block.plots_count.toLocaleString("en-PK")} plots</small>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PlotSearch({ onPick }: { onPick: (result: PlotSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlotSearchResult[] | null>(null);
  const [open, setOpen] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const term = query.trim();

    if (!/\d/.test(term)) {
      return;
    }

    const timer = setTimeout(async () => {
      controller.current?.abort();
      controller.current = new AbortController();

      try {
        const response = await fetch(`/api/map/plots/search?q=${encodeURIComponent(term)}`, { signal: controller.current.signal });
        const { data } = (await response.json()) as { data: PlotSearchResult[] };
        setResults(data ?? []);
        setOpen(true);
      } catch {
        // A newer search replaced this one, or the API is down; keep the last results.
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const pick = (result: PlotSearchResult) => {
    setOpen(false);
    setQuery(result.label);
    onPick(result);
  };

  return (
    <form
      className="pf-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();

        if (results?.[0]) {
          pick(results[0]);
        }
      }}
    >
      <SearchIcon className="icon" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search plot, e.g. G-4 123"
        aria-label="Search plot number"
        maxLength={100}
      />
      {open && results && /\d/.test(query) && (
        <ul className="pf-search-results" role="listbox">
          {results.length === 0 ? (
            <li className="pf-search-empty">No plot found. Try the plot number only.</li>
          ) : (
            results.map((result) => (
              <li key={result.id} role="option" aria-selected={false}>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pick(result)}>
                  <span className="pf-swatch" style={{ background: PLOT_TYPES[result.type]?.color }} aria-hidden="true" />
                  <span>
                    <strong>{result.label}</strong>
                    <small>{[PLOT_TYPES[result.type]?.label, result.size_label].filter(Boolean).join(" · ")}</small>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  );
}

function PlotDetails({ plot, whatsapp, postPropertyUrl, onBack }: { plot: PlotDetail; whatsapp: string | null; postPropertyUrl: string; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const type = PLOT_TYPES[plot.type] ?? PLOT_TYPES.other;
  const facts = [
    { label: "Plot type", value: type.label },
    { label: "Size", value: plot.size_label },
    { label: "Sector", value: sectorName(plot.sector.name) },
    { label: "Block", value: plot.block ? blockName(plot.block.name) : null },
    { label: "Street", value: plot.street },
  ].filter((fact) => fact.value);
  const message = `Hi, I'm interested in ${plot.label} (DHA Gujranwala). ${typeof window === "undefined" ? "" : window.location.href}`;

  const share = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: plot.label, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // The visitor closed the share sheet.
    }
  };

  return (
    <div className="pf-plot">
      <button type="button" className="pf-back" onClick={onBack}>
        <ArrowLeftIcon className="icon" /> Back to areas
      </button>

      <div className="pf-plot-head">
        <span className="pf-plot-type" style={{ background: type.color }}>
          {type.label}
        </span>
        <h2>Plot {plot.plot_number}</h2>
        <p>{[plot.society?.name, plot.phase ? `Phase ${plot.phase.name}` : null, sectorName(plot.sector.name), plot.block ? blockName(plot.block.name) : null].filter(Boolean).join(", ")}</p>
        {(plot.is_corner || plot.is_park_facing) && (
          <ul className="author-chips">
            {plot.is_corner && <li>Corner</li>}
            {plot.is_park_facing && <li>Park facing</li>}
          </ul>
        )}
      </div>

      <dl className="pf-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="pf-actions">
        {whatsapp && (
          <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="icon" /> Ask about this plot
          </a>
        )}
        <a className="btn btn-outline" href={`https://www.google.com/maps/dir/?api=1&destination=${plot.center.lat},${plot.center.lng}`} target="_blank" rel="noopener noreferrer">
          <PinIcon className="icon" /> Directions
        </a>
        <button type="button" className="btn btn-outline" onClick={share}>
          <ShareIcon className="icon" /> {copied ? "Link copied" : "Share"}
        </button>
      </div>

      <section className="pf-listings" aria-labelledby="pf-listings">
        <h3 id="pf-listings">Listings for this plot</h3>
        {plot.listings.length === 0 ? (
          <div className="pf-no-listings">
            <p>No listings for this plot right now.</p>
            <a className="btn btn-primary btn-block" href={postPropertyUrl}>
              Own this plot? List it for free
            </a>
          </div>
        ) : (
          <ul>
            {plot.listings.map((listing) => {
              const cover = coverOf(listing);

              return (
                <li key={listing.id}>
                  <Link href={propertyHref(listing)} className="pf-listing">
                    <span className="pf-listing-photo">{cover && <Image src={thumbnailUrl(cover)} alt="" fill sizes="88px" style={{ objectFit: "cover" }} />}</span>
                    <span>
                      <strong>{formatCompactPrice(listing.price)}</strong>
                      <span className="pf-listing-title">{listing.title}</span>
                      <small>
                        {listing.purpose === "rent" ? "For rent" : "For sale"} · {Number(listing.area_size)} {AREA_UNIT_LABELS[listing.area_unit]}
                      </small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
