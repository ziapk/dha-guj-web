"use client";

import { InboxOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { App, Button, Checkbox, Form, Input, InputNumber, Segmented, Select, Upload, type UploadFile } from "antd";
import Link from "next/link";
import { useState } from "react";
import { CheckCircleIcon } from "@/components/icons";
import { AREA_UNIT_LABELS, PROPERTY_CATEGORY_LABELS, formatCompactPrice, toOptions } from "@/lib/labels";
import type { AreaUnit, Block, Collection, Phase, PropertyCategory, PropertyPurpose, PropertyType, Sector } from "@/types/api";

type PriceUnit = "pkr" | "lakh" | "crore";

type Values = {
  purpose: PropertyPurpose;
  property_type_id?: number;
  area_size?: number;
  area_unit: AreaUnit;
  possession?: string;
  phase_id?: number | null;
  sector_id?: number | null;
  block_id?: number | null;
  street?: string;
  plot_number?: string;
  price?: number;
  price_unit: PriceUnit;
  is_negotiable?: boolean;
  title?: string;
  description?: string;
  video_url?: string;
  name?: string;
  phone?: string;
  email?: string;
  owner_type: "owner" | "agent" | "representative";
  consent?: boolean;
  /** Hidden field that only bots fill in. */
  website?: string;
};

const POSSESSION_OPTIONS = [
  { value: "ready_to_move", label: "Ready to Move" },
  { value: "under_construction", label: "Under Construction" },
  { value: "pre_launch", label: "Pre-Launch / Booking" },
  { value: "key_handover_done", label: "Key Handover Done" },
  { value: "balloted", label: "Balloted" },
  { value: "non_balloted", label: "Non Balloted Location" },
];

const OWNER_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "agent", label: "Dealer / Agent" },
  { value: "representative", label: "Authorized Representative" },
];

const PRICE_MULTIPLIER: Record<PriceUnit, number> = { pkr: 1, lakh: 100_000, crore: 10_000_000 };

const MAX_PHOTOS = 10;
const MAX_PHOTO_MB = 20;
/** Photos are scaled down in the browser before upload: faster on mobile data, and well inside server limits. */
const UPLOAD_SIDE = 1920;

const toRupees = (price: number | undefined, unit: PriceUnit) => (price ? Math.round(price * PRICE_MULTIPLIER[unit]) : 0);

/** Scale a photo to at most UPLOAD_SIDE on its longest side as JPEG; the original when the browser cannot decode it. */
async function shrinkPhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, UPLOAD_SIDE / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();

      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));

    return blob ?? file;
  } catch {
    return file;
  }
}

async function fetchList<T>(url: string): Promise<T[]> {
  const response = await fetch(url);

  return response.ok ? ((await response.json()) as Collection<T>).data : [];
}

/** The Sell Property submission form (design: dhagrwproperties.com/sell-property). Goes to the admin team for review. */
export function SellPropertyForm({
  propertyTypes,
  phases,
  defaultPhaseId,
  siteName,
}: {
  propertyTypes: PropertyType[];
  phases: Phase[];
  defaultPhaseId: number | null;
  siteName: string;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<number | null>(null);

  const purpose = Form.useWatch("purpose", form);
  const phaseId = Form.useWatch("phase_id", form);
  const sectorId = Form.useWatch("sector_id", form);
  const price = Form.useWatch("price", form);
  const priceUnit = Form.useWatch("price_unit", form) ?? "pkr";

  const sectors = useQuery({
    queryKey: ["sectors", phaseId],
    enabled: Boolean(phaseId),
    staleTime: 60 * 60 * 1000,
    queryFn: () => fetchList<Sector>(`/api/sectors?phase_id=${phaseId}`),
  });

  const blocks = useQuery({
    queryKey: ["blocks", sectorId],
    enabled: Boolean(sectorId),
    staleTime: 60 * 60 * 1000,
    queryFn: () => fetchList<Block>(`/api/blocks?sector_id=${sectorId}`),
  });

  const hasSectors = (sectors.data ?? []).length > 0;

  const typeOptions = (Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[])
    .map((category) => ({
      label: PROPERTY_CATEGORY_LABELS[category],
      options: propertyTypes.filter((type) => type.category === category).map((type) => ({ value: type.id, label: type.name })),
    }))
    .filter((group) => group.options.length > 0);

  const submit = async (values: Values) => {
    setSending(true);

    try {
      const body = new FormData();
      const fields: Record<string, string | number | null | undefined> = {
        purpose: values.purpose,
        property_type_id: values.property_type_id,
        area_size: values.area_size,
        area_unit: values.area_unit,
        possession: values.possession,
        phase_id: values.phase_id,
        sector_id: values.sector_id,
        block_id: values.block_id,
        street: values.street,
        plot_number: values.plot_number,
        price: toRupees(values.price, values.price_unit),
        is_negotiable: values.is_negotiable ? 1 : 0,
        title: values.title,
        description: values.description,
        video_url: values.video_url,
        name: values.name,
        phone: values.phone,
        email: values.email,
        owner_type: values.owner_type,
        website: values.website,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && `${value}`.trim() !== "") {
          body.append(key, `${value}`);
        }
      }

      const shrunk = await Promise.all(photos.map((photo) => (photo.originFileObj ? shrinkPhoto(photo.originFileObj) : null)));
      shrunk.forEach((blob, index) => {
        if (blob) {
          const name = (photos[index].name || `photo-${index + 1}`).replace(/\.[^.]+$/, "");
          body.append("photos[]", blob, blob.type === "image/jpeg" ? `${name}.jpg` : photos[index].name);
        }
      });

      const response = await fetch("/api/sell-property", { method: "POST", headers: { Accept: "application/json" }, body });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]>; data?: { id?: number } };

      if (!response.ok) {
        if (response.status === 422 && payload.errors) {
          const photoErrors = Object.entries(payload.errors).filter(([name]) => name.startsWith("photos"));
          const fieldErrors = Object.entries(payload.errors)
            .filter(([name]) => !name.startsWith("photos"))
            .map(([name, errors]) => ({ name: name as keyof Values, errors }));

          form.setFields(fieldErrors);

          if (photoErrors.length > 0) {
            message.error(photoErrors[0][1][0] ?? "One of the photos could not be accepted.");
          }

          if (fieldErrors[0]) {
            form.scrollToField(fieldErrors[0].name, { behavior: "smooth", block: "center" });
          }

          return;
        }

        message.error(
          response.status === 429 ? "You have sent several submissions in a short time. Please wait a few minutes and try again." : (payload.message ?? "Your property could not be submitted. Please try again."),
        );

        return;
      }

      setSentId(payload.data?.id ?? 0);
      form.resetFields();
      setPhotos([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      message.error("Your property could not be submitted. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sentId !== null) {
    return (
      <div className="sell-form sell-sent" role="status">
        <CheckCircleIcon className="icon" />
        <h2>Thank you — your property has been submitted</h2>
        <p>
          {sentId > 0 && (
            <>
              Your reference number is <strong>#{sentId}</strong>.{" "}
            </>
          )}
          Our team will review the details and call you shortly to confirm the valuation before it goes live.
        </p>
        <div className="sell-sent-actions">
          <Button type="primary" size="large" onClick={() => setSentId(null)}>
            Submit another property
          </Button>
          <Link href="/properties-for-sale">
            <Button size="large">Browse properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      requiredMark
      className="sell-form"
      initialValues={{ purpose: "sale", area_unit: "marla", price_unit: "pkr", owner_type: "owner", phase_id: defaultPhaseId }}
      onFinish={submit}
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
    >
      <section className="sell-card">
        <h2>Purpose</h2>
        <Form.Item name="purpose" noStyle>
          <Segmented
            block
            size="large"
            options={[
              { value: "sale", label: "Sell" },
              { value: "rent", label: "Rent" },
            ]}
          />
        </Form.Item>
      </section>

      <section className="sell-card">
        <h2>Property Details</h2>
        <div className="form-grid">
          <Form.Item name="property_type_id" label="Property Type" rules={[{ required: true, message: "Choose the property type" }]}>
            <Select showSearch={{ optionFilterProp: "label" }} placeholder="Select type" options={typeOptions} />
          </Form.Item>
          <Form.Item label="Land Area" required>
            <div className="sell-input-group">
              <Form.Item name="area_size" noStyle rules={[{ required: true, message: "Enter the land area" }]}>
                <InputNumber<number> min={0.01} max={1_000_000} placeholder="e.g. 10" style={{ width: "100%" }} aria-label="Land area" />
              </Form.Item>
              <Form.Item name="area_unit" noStyle>
                <Select options={toOptions(AREA_UNIT_LABELS)} style={{ width: 120 }} aria-label="Area unit" />
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item name="possession" label="Possession / File Status">
            <Select allowClear placeholder="Select status" options={POSSESSION_OPTIONS} />
          </Form.Item>
          <Form.Item name="phase_id" label="Phase">
            <Select
              allowClear
              placeholder="Select phase"
              options={phases.map((phase) => ({ value: phase.id, label: phase.name }))}
              onChange={() => form.setFieldsValue({ sector_id: null, block_id: null })}
            />
          </Form.Item>
          <Form.Item name="sector_id" label="Sector" rules={[{ required: hasSectors, message: "Choose the sector" }]}>
            <Select
              allowClear
              showSearch={{ optionFilterProp: "label" }}
              disabled={!phaseId}
              loading={sectors.isFetching}
              placeholder={phaseId ? "Select sector" : "Choose a phase first"}
              options={(sectors.data ?? []).map((sector) => ({ value: sector.id, label: sector.name }))}
              onChange={() => form.setFieldsValue({ block_id: null })}
            />
          </Form.Item>
          <Form.Item name="block_id" label="Block">
            <Select
              allowClear
              showSearch={{ optionFilterProp: "label" }}
              disabled={!sectorId || (blocks.data ?? []).length === 0}
              loading={blocks.isFetching}
              placeholder={sectorId ? "Select block" : "Choose a sector first"}
              options={(blocks.data ?? []).map((block) => ({ value: block.id, label: block.name }))}
            />
          </Form.Item>
          <Form.Item name="street" label="Street No." rules={[{ max: 30 }]}>
            <Input placeholder="e.g. 12" />
          </Form.Item>
          <Form.Item name="plot_number" label="Plot / House No." rules={[{ max: 30 }]}>
            <Input placeholder="e.g. 245" />
          </Form.Item>
        </div>
      </section>

      <section className="sell-card">
        <h2>{purpose === "rent" ? "Monthly Rent" : "Demand Price"}</h2>
        <Form.Item
          label={purpose === "rent" ? "Rent (PKR / month)" : "Price (PKR)"}
          required
          extra={price ? <span className="form-hint">{formatCompactPrice(toRupees(price, priceUnit))}</span> : undefined}
        >
          <div className="sell-input-group">
            <Form.Item
              name="price"
              noStyle
              rules={[
                { required: true, message: "Enter your demand" },
                { validator: (_, value?: number) => (!value || toRupees(value, form.getFieldValue("price_unit")) >= 1 ? Promise.resolve() : Promise.reject(new Error("Enter your demand"))) },
              ]}
            >
              <InputNumber<number>
                min={0}
                prefix="Rs"
                placeholder={priceUnit === "pkr" ? "e.g. 12500000" : "e.g. 125"}
                style={{ width: "100%" }}
                formatter={(value) => (value === undefined || `${value}` === "" ? "" : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
                parser={(value) => Number((value ?? "").replace(/[^\d.]/g, "")) || 0}
                aria-label="Price"
              />
            </Form.Item>
            <Form.Item name="price_unit" noStyle>
              <Select
                style={{ width: 120 }}
                aria-label="Price unit"
                options={[
                  { value: "pkr", label: "PKR" },
                  { value: "lakh", label: "Lakh" },
                  { value: "crore", label: "Crore" },
                ]}
              />
            </Form.Item>
          </div>
        </Form.Item>
        <Form.Item name="is_negotiable" valuePropName="checked">
          <Checkbox>Price is negotiable</Checkbox>
        </Form.Item>
      </section>

      <section className="sell-card">
        <h2>Description</h2>
        <Form.Item name="title" label="Listing Title" rules={[{ max: 150 }]}>
          <Input placeholder="e.g. 10 Marla Residential Plot in Sector B" maxLength={150} />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 3000 }]}>
          <Input.TextArea
            rows={5}
            maxLength={3000}
            showCount
            placeholder="Location advantages, corner/park facing, road width, nearby landmarks, reason for selling…"
          />
        </Form.Item>
      </section>

      <section className="sell-card">
        <h2>Photos &amp; Documents</h2>
        <Upload.Dragger
          multiple
          accept="image/jpeg,image/png,image/webp"
          listType="picture"
          fileList={photos}
          maxCount={MAX_PHOTOS}
          beforeUpload={(file) => {
            if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
              message.error(`${file.name} is larger than ${MAX_PHOTO_MB} MB.`);

              return Upload.LIST_IGNORE;
            }

            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
              message.error(`${file.name} is not a JPG, PNG or WebP image.`);

              return Upload.LIST_IGNORE;
            }

            return false;
          }}
          onChange={({ fileList }) => setPhotos(fileList.slice(0, MAX_PHOTOS).map((file) => ({ ...file, status: "done" })))}
          className="sell-upload"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag to upload photos</p>
          <p className="ant-upload-hint">
            JPG, PNG or WebP up to {MAX_PHOTO_MB} MB each · up to {MAX_PHOTOS} images · add clear front, side &amp; document images
          </p>
        </Upload.Dragger>
        <Form.Item name="video_url" label="Video URL (optional)" rules={[{ type: "url", message: "Enter a full link starting with https://" }, { max: 500 }]} style={{ marginTop: 20 }}>
          <Input inputMode="url" placeholder="YouTube, YouTube Shorts, Vimeo or TikTok link" />
        </Form.Item>
      </section>

      <section className="sell-card">
        <h2>Your Contact Details</h2>
        <div className="form-grid">
          <Form.Item name="name" label="Full Name" rules={[{ required: true, whitespace: true, message: "Tell us your name" }, { min: 2 }, { max: 100 }]}>
            <Input placeholder="Your name" autoComplete="name" />
          </Form.Item>
          <Form.Item name="phone" label="Mobile / WhatsApp" rules={[{ required: true, message: "We need a number to call you back" }]}>
            <Input placeholder="03xx-xxxxxxx" autoComplete="tel" inputMode="tel" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Enter a valid email address" }]}>
            <Input placeholder="you@email.com" autoComplete="email" inputMode="email" />
          </Form.Item>
          <Form.Item name="owner_type" label="You Are">
            <Select options={OWNER_OPTIONS} />
          </Form.Item>
        </div>

        {/* Hidden from people, irresistible to bots. */}
        <Form.Item name="website" hidden>
          <Input tabIndex={-1} autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="consent"
          valuePropName="checked"
          rules={[{ validator: (_, value: boolean) => (value ? Promise.resolve() : Promise.reject(new Error("Please confirm this to continue"))) }]}
        >
          <Checkbox>
            I confirm the information provided is accurate and I am authorized to list this property. I agree to be contacted by {siteName} regarding this listing.
          </Checkbox>
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={sending}>
          Submit Property for Review
        </Button>
        <p className="sell-form-note">Our team reviews every submission before it goes live.</p>
      </section>
    </Form>
  );
}
