"use client";

import {
  AppstoreOutlined,
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BorderOutlined,
  BuildOutlined,
  BulbOutlined,
  DeleteOutlined,
  GoldOutlined,
  HolderOutlined,
  HomeOutlined,
  PlusOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Form, InputNumber, Select } from "antd";
import { useState, type DragEvent, type ReactNode } from "react";
import { AREA_UNIT_LABELS, toOptions } from "@/lib/labels";
import type { AreaUnit, PropertyCategory, PropertyType } from "@/types/api";

/*
 * The building blocks of the Property Admin's Add listing form (dha-guj-portal: listing-form.tsx and
 * listing-inputs.tsx), so the public Sell Property form looks and works the same. Styles: the "lf-" rules in globals.css.
 */

/** A full-width card: icon and title on the left, the fields on the right. */
export function FormBlock({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="lf-block">
      <div className="lf-block-head">
        <span className="lf-block-icon">{icon}</span>
        <h2 className="lf-block-title">{title}</h2>
        {hint && <p className="lf-block-hint">{hint}</p>}
      </div>
      <div className="lf-block-body">{children}</div>
    </section>
  );
}

/** One question inside a block: a small icon in the gutter, a label and an optional hint. */
export function Field({ icon, label, hint, children }: { icon: ReactNode; label: ReactNode; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className="lf-field">
      <span className="lf-field-icon">{icon}</span>
      <div className="lf-field-main">
        <div className="lf-field-head">
          <div>
            <div className="lf-field-label">{label}</div>
            {hint && <div className="lf-field-hint">{hint}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

type ChipOption<T> = { value: T; label: ReactNode; icon?: ReactNode };

/** Pill buttons for a single choice. Works as a Form.Item control (value / onChange). */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
  clearable = false,
}: {
  options: ChipOption<T>[];
  value?: T | null;
  onChange?: (value: T | null) => void;
  disabled?: boolean;
  /** Clicking the chosen chip again clears the choice. */
  clearable?: boolean;
}) {
  return (
    <div className="lf-chips" role="radiogroup">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            className={`lf-chip${active ? " active" : ""}`}
            onClick={() => onChange?.(active && clearable ? null : option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const CATEGORY_TABS: Record<PropertyCategory, string> = { residential: "Home", plot: "Plots", commercial: "Commercial" };

/** Home / Plots / Commercial underline tabs for the category. */
export function CategoryTabs({
  value,
  onChange,
  onPick,
  disabled,
}: {
  value?: PropertyCategory;
  onChange?: (value: PropertyCategory) => void;
  onPick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="lf-tabs" role="tablist">
      {(Object.entries(CATEGORY_TABS) as [PropertyCategory, string][]).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          disabled={disabled}
          className={`lf-tab${value === key ? " active" : ""}`}
          onClick={() => {
            if (value !== key) {
              onChange?.(key);
              onPick?.();
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** A best-guess icon for a property type chip, from its name. */
export function propertyTypeIcon(type: PropertyType): ReactNode {
  const name = `${type.slug} ${type.name}`.toLowerCase();

  if (/flat|apartment|penthouse/.test(name)) return <ApartmentOutlined />;
  if (/shop|mart|store/.test(name)) return <ShopOutlined />;
  if (/office/.test(name)) return <BankOutlined />;
  if (/warehouse|factory|godown/.test(name)) return <GoldOutlined />;
  if (/building|plaza/.test(name)) return <BuildOutlined />;
  if (/plot|land|file/.test(name)) return <BorderOutlined />;
  if (/house|home|villa|farm|portion|room|annexe/.test(name)) return <HomeOutlined />;

  return <AppstoreOutlined />;
}

/** The plot sizes people list most in DHA Gujranwala. */
const AREA_PRESETS: { size: number; unit: AreaUnit; label: string }[] = [
  { size: 4, unit: "marla", label: "4 Marla" },
  { size: 5, unit: "marla", label: "5 Marla" },
  { size: 6, unit: "marla", label: "6 Marla" },
  { size: 8, unit: "marla", label: "8 Marla" },
  { size: 10, unit: "marla", label: "10 Marla" },
  { size: 1, unit: "kanal", label: "1 Kanal" },
  { size: 2, unit: "kanal", label: "2 Kanal" },
];

const isPreset = (size: unknown, unit: unknown) => AREA_PRESETS.some((preset) => Number(size) === preset.size && unit === preset.unit);

/**
 * Area size as one-tap chips for the common sizes, plus "Other" for the exact number and unit.
 * Must sit inside a Form; it owns area_size and area_unit.
 */
export function AreaSizeField({ disabled }: { disabled?: boolean }) {
  const form = Form.useFormInstance();
  const size = Form.useWatch("area_size", form);
  const unit = Form.useWatch("area_unit", form);
  const [other, setOther] = useState(false);
  const hasSize = size !== undefined && size !== null && size !== "";
  const custom = other || (hasSize && !isPreset(size, unit));

  return (
    <>
      <div className="lf-chips lf-area-presets" role="radiogroup" aria-label="Area size">
        {AREA_PRESETS.map((preset) => {
          const active = !custom && Number(size) === preset.size && unit === preset.unit;

          return (
            <button
              key={preset.label}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              className={`lf-chip${active ? " active" : ""}`}
              onClick={() => {
                setOther(false);
                form.setFieldsValue({ area_size: preset.size, area_unit: preset.unit });
                void form.validateFields(["area_size"]);
              }}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={custom}
          disabled={disabled}
          className={`lf-chip${custom ? " active" : ""}`}
          onClick={() => {
            if (!custom) {
              setOther(true);
              form.setFieldsValue({ area_size: undefined, area_unit: unit ?? "marla" });
            }
          }}
        >
          <PlusOutlined /> Other
        </button>
      </div>
      {/* The fields stay mounted while hidden so "required" still reports a missing size under the chips. */}
      <div className={custom ? "lf-pair" : undefined}>
        <Form.Item name="area_size" rules={[{ required: true, message: custom ? "Enter the area" : "Choose a size, or Other to enter your own" }]} style={custom ? undefined : { marginBottom: 0 }}>
          <InputNumber min={0.01} max={1_000_000} placeholder="Enter area" autoFocus={other} style={custom ? { width: "100%" } : { display: "none" }} />
        </Form.Item>
        <Form.Item name="area_unit" rules={[{ required: true }]} hidden={!custom}>
          <Select options={toOptions(AREA_UNIT_LABELS)} aria-label="Area unit" />
        </Form.Item>
      </div>
    </>
  );
}

const PRICE_UNITS = [
  { value: 1_000, label: "Thousand" },
  { value: 100_000, label: "Lakh" },
  { value: 10_000_000, label: "Crore" },
];

/** The unit a stored amount reads best in: 1,50,00,000 → 1.5 Crore, 45,000 → 45 Thousand. */
function unitFor(amount: number): number {
  return [...PRICE_UNITS].reverse().find((unit) => amount >= unit.value)?.value ?? 1_000;
}

const trim = (value: number) => Number(value.toFixed(3));

/**
 * A PKR price typed the way it is said: an amount plus Thousand / Lakh / Crore. Works as a Form.Item control;
 * its value is always the full amount in rupees.
 */
export function PriceInput({
  value,
  onChange,
  disabled,
  placeholder = "e.g. 1.5",
  defaultUnit = 100_000,
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultUnit?: number;
}) {
  const [unit, setUnit] = useState(() => (value ? unitFor(value) : defaultUnit));
  const [amount, setAmount] = useState<number | null>(() => (value ? trim(value / unit) : null));
  // A value set from outside (e.g. a form reset) is shown in the unit that reads best.
  const [seen, setSeen] = useState(value ?? null);

  if ((value ?? null) !== seen) {
    setSeen(value ?? null);

    if (value && Math.round((amount ?? 0) * unit) !== value) {
      const next = unitFor(value);
      setUnit(next);
      setAmount(trim(value / next));
    } else if (!value) {
      setAmount(null);
    }
  }

  function emit(nextAmount: number | null, nextUnit: number) {
    const rupees = nextAmount ? Math.round(nextAmount * nextUnit) : null;
    setSeen(rupees);
    onChange?.(rupees);
  }

  return (
    <div className="lf-price">
      <InputNumber<number>
        min={0}
        step={0.5}
        precision={3}
        placeholder={placeholder}
        disabled={disabled}
        value={amount}
        onChange={(next) => {
          setAmount(next);
          emit(next, unit);
        }}
        style={{ width: "100%" }}
        prefix="PKR"
        aria-label="Price amount"
      />
      <Select
        value={unit}
        disabled={disabled}
        options={PRICE_UNITS}
        aria-label="Price unit"
        onChange={(next) => {
          setUnit(next);
          emit(amount, next);
        }}
      />
    </div>
  );
}

/** "Add at least N …" nudge with a percentage, like a progress score. */
export function QualityTip({ text, current, target }: { text: string; current: number; target: number }) {
  const percent = Math.min(100, Math.round((current / target) * 100));
  const done = percent >= 100;

  return (
    <div className={`lf-tip${done ? " done" : ""}`}>
      <BulbOutlined className="lf-tip-icon" />
      <div className="lf-tip-text">
        <strong>{done ? "Looks great" : "Quality tip"}</strong>
        <span>{done ? "This part of your listing is complete." : text}</span>
      </div>
      <span className="lf-tip-score">{percent}%</span>
    </div>
  );
}

export type SortableThumb = { key: string | number; src?: string; alt: string };

/**
 * Photo thumbnails that can be dragged into a new order (arrow buttons do the same on touch screens and for
 * keyboard users). The first one is the cover.
 */
export function SortableThumbs({
  items,
  onReorder,
  onRemove,
  disabled,
}: {
  items: SortableThumb[];
  onReorder: (keys: SortableThumb["key"][]) => void;
  onRemove?: (key: SortableThumb["key"]) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) {
      return;
    }

    const keys = items.map((item) => item.key);
    const [moved] = keys.splice(from, 1);
    keys.splice(to, 0, moved);
    onReorder(keys);
  }

  function drop(event: DragEvent, index: number) {
    event.preventDefault();

    if (dragging !== null) {
      move(dragging, index);
    }

    setDragging(null);
    setOver(null);
  }

  return (
    <div className="lf-thumbs">
      {items.map((item, index) => (
        <div
          key={item.key}
          className={`lf-thumb${dragging === index ? " dragging" : ""}${over === index && dragging !== index ? " drop-target" : ""}`}
          draggable={!disabled}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            setDragging(index);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(index);
          }}
          onDragLeave={() => setOver((current) => (current === index ? null : current))}
          onDrop={(event) => drop(event, index)}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={item.src} alt={item.alt} draggable={false} />
          {index === 0 ? <span className="lf-thumb-cover">Cover</span> : <span className="lf-thumb-cover lf-thumb-index">{index + 1}</span>}
          {!disabled && (
            <>
              <HolderOutlined className="lf-thumb-grip" aria-hidden />
              <div className="lf-thumb-moves">
                <button type="button" aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowLeftOutlined />
                </button>
                <button type="button" aria-label="Move later" disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>
                  <ArrowRightOutlined />
                </button>
              </div>
              {onRemove && (
                <button type="button" aria-label="Remove photo" className="lf-thumb-remove" onClick={() => onRemove(item.key)}>
                  <DeleteOutlined />
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
