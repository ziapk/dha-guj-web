"use client";

import { CheckOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import Link from "next/link";
import { CompareIcon } from "@/components/icons";
import { MAX_COMPARE, compareStore } from "@/lib/id-store";

/** Add or remove a listing from the comparison (kept in the browser, up to three). */
export function CompareButton({ propertyId, variant = "overlay" }: { propertyId: number; variant?: "overlay" | "button" }) {
  const { message } = App.useApp();
  const ids = compareStore.useIds();
  const selected = ids.includes(propertyId);

  function toggle() {
    const current = compareStore.read();

    if (current.includes(propertyId)) {
      compareStore.remove(propertyId);

      return;
    }

    if (current.length >= MAX_COMPARE) {
      message.warning(
        <span>
          You can compare up to {MAX_COMPARE} properties. Remove one first, or <Link href="/compare">compare them now</Link>.
        </span>,
      );

      return;
    }

    compareStore.write([...current, propertyId]);
  }

  if (variant === "button") {
    return (
      <Button size="large" block icon={selected ? <CheckOutlined /> : <CompareIcon />} aria-pressed={selected} onClick={toggle}>
        {selected ? "Added to compare" : "Compare"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={`compare-toggle${selected ? " selected" : ""}`}
      aria-pressed={selected}
      aria-label={selected ? "Remove from compare" : "Add to compare"}
      onClick={toggle}
    >
      {selected ? <CheckOutlined aria-hidden /> : <CompareIcon />}
      <span aria-hidden="true">Compare</span>
    </button>
  );
}
