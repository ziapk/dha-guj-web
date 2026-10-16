"use client";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CompassOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExpandOutlined,
  FileTextOutlined,
  FlagOutlined,
  FontSizeOutlined,
  IdcardOutlined,
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  NumberOutlined,
  PhoneOutlined,
  PictureOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
  VideoCameraOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { App, Button, Checkbox, Col, Form, Input, Row, Select, Switch, Upload, type UploadFile } from "antd";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CheckCircleIcon } from "@/components/icons";
import { AreaSizeField, CategoryTabs, ChipGroup, Field, FormBlock, PriceInput, QualityTip, SortableThumbs, propertyTypeIcon } from "@/components/listing-form-ui";
import { formatCompactPrice } from "@/lib/labels";
import type { AreaUnit, Block, Collection, Phase, PropertyCategory, PropertyPurpose, PropertyType, Sector } from "@/types/api";

type OwnerType = "owner" | "agent" | "representative";

type Values = {
  purpose: PropertyPurpose;
  /** UI only: filters the property type chips. */
  category: PropertyCategory;
  property_type_id?: number;
  area_size?: number;
  area_unit: AreaUnit;
  possession?: string | null;
  phase_id?: number | null;
  sector_id?: number | null;
  block_id?: number | null;
  street?: string;
  plot_number?: string;
  price?: number | null;
  is_negotiable: boolean;
  title?: string;
  description?: string;
  video_url?: string;
  name?: string;
  phone?: string;
  email?: string;
  owner_type: OwnerType;
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
  { value: "non_balloted", label: "Non Balloted" },
];

const OWNER_OPTIONS: { value: OwnerType; label: string; icon: ReactNode }[] = [
  { value: "owner", label: "Owner", icon: <UserOutlined /> },
  { value: "agent", label: "Dealer / Agent", icon: <TeamOutlined /> },
  { value: "representative", label: "Authorized Representative", icon: <IdcardOutlined /> },
];

/** Fields sent to the API as they are (category, consent and the photos are handled separately). */
const FIELDS: (keyof Values)[] = [
  "purpose",
  "property_type_id",
  "area_size",
  "area_unit",
  "possession",
  "phase_id",
  "sector_id",
  "block_id",
  "street",
  "plot_number",
  "price",
  "title",
  "description",
  "video_url",
  "name",
  "phone",
  "email",
  "owner_type",
  "website",
];

const MAX_PHOTOS = 10;
const PHOTO_TARGET = 5;
const MAX_PHOTO_MB = 20;
/** Photos are scaled down in the browser before upload: faster on mobile data, and well inside server limits. */
const UPLOAD_SIDE = 1920;

type PendingPhoto = { uid: string; name: string; file: File; preview: string };

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

/**
 * The public Sell Property form, laid out like the Property Admin's Add listing form. Submissions go to the
 * admin team's Sell Requests inbox for review.
 */
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
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<number | null>(null);

  const purpose = Form.useWatch("purpose", form);
  const category = Form.useWatch("category", form) ?? "residential";
  const phaseId = Form.useWatch("phase_id", form);
  const sectorId = Form.useWatch("sector_id", form);
  const price = Form.useWatch("price", form);

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

  const typeOptions = propertyTypes
    .filter((type) => type.category === category)
    .map((type) => ({ value: type.id, label: type.name, icon: propertyTypeIcon(type) }));

  function addPhoto(file: File) {
    setPhotos((current) =>
      current.length >= MAX_PHOTOS ? current : [...current, { uid: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, file, preview: URL.createObjectURL(file) }],
    );
  }

  function removePhoto(uid: string | number) {
    const photo = photos.find((item) => item.uid === uid);

    if (photo) {
      URL.revokeObjectURL(photo.preview);
    }

    setPhotos((current) => current.filter((item) => item.uid !== uid));
  }

  const submit = async (values: Values) => {
    setSending(true);

    try {
      const body = new FormData();

      for (const field of FIELDS) {
        const value = values[field];

        if (value !== undefined && value !== null && `${value}`.trim() !== "") {
          body.append(field, `${value}`.trim());
        }
      }

      body.append("is_negotiable", values.is_negotiable ? "1" : "0");

      const shrunk = await Promise.all(photos.map((photo) => shrinkPhoto(photo.file)));
      shrunk.forEach((blob, index) => {
        const name = photos[index].name.replace(/\.[^.]+$/, "") || `photo-${index + 1}`;
        body.append("photos[]", blob, blob.type === "image/jpeg" ? `${name}.jpg` : photos[index].name);
      });

      const response = await fetch("/api/sell-property", { method: "POST", headers: { Accept: "application/json" }, body });
      const payload = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]>; data?: { id?: number } };

      if (!response.ok) {
        if (response.status === 422 && payload.errors) {
          const photoError = Object.entries(payload.errors).find(([name]) => name.startsWith("photos"));
          const fieldErrors = Object.entries(payload.errors)
            .filter(([name]) => !name.startsWith("photos"))
            .map(([name, errors]) => ({ name: name as keyof Values, errors }));

          form.setFields(fieldErrors);

          if (photoError) {
            message.error(photoError[1][0] ?? "One of the photos could not be accepted.");
          }

          if (fieldErrors[0]) {
            form.scrollToField(fieldErrors[0].name, { behavior: "smooth", block: "center" });
          }

          return;
        }

        message.error(
          response.status === 429
            ? "You have sent several submissions in a short time. Please wait a few minutes and try again."
            : (payload.message ?? "Your property could not be submitted. Please try again."),
        );

        return;
      }

      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      form.resetFields();
      setSentId(payload.data?.id ?? 0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      message.error("Your property could not be submitted. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sentId !== null) {
    return (
      <div className="lf-block sell-sent" role="status">
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
      requiredMark={false}
      className="listing-form"
      disabled={sending}
      initialValues={{ purpose: "sale", category: "residential", area_unit: "marla", owner_type: "owner", is_negotiable: false, phase_id: defaultPhaseId }}
      onFinish={submit}
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
    >
      <FormBlock icon={<FileTextOutlined />} title="Basic Information">
        <Field icon={<CheckCircleOutlined />} label="Select purpose">
          <Form.Item name="purpose" rules={[{ required: true }]}>
            <ChipGroup
              disabled={sending}
              options={[
                { value: "sale", label: "Sell", icon: <TagOutlined /> },
                { value: "rent", label: "Rent", icon: <KeyOutlined /> },
              ]}
            />
          </Form.Item>
        </Field>

        <Field icon={<AppstoreOutlined />} label="Select property type">
          <Form.Item name="category" noStyle>
            <CategoryTabs disabled={sending} onPick={() => form.setFieldValue("property_type_id", undefined)} />
          </Form.Item>
          <Form.Item name="property_type_id" rules={[{ required: true, message: "Choose a property type" }]}>
            {typeOptions.length > 0 ? <ChipGroup disabled={sending} options={typeOptions} /> : <span className="lf-field-hint">No property types in this group.</span>}
          </Form.Item>
        </Field>

        <Field icon={<ExpandOutlined />} label="Area size" hint="Pick a common size, or Other to enter the exact area and unit.">
          <AreaSizeField disabled={sending} />
        </Field>

        <Field icon={<FlagOutlined />} label="Possession / file status" hint="Optional.">
          <Form.Item name="possession">
            <ChipGroup disabled={sending} clearable options={POSSESSION_OPTIONS} />
          </Form.Item>
        </Field>

        <Field icon={<FontSizeOutlined />} label="Title" hint="Optional. We write one for you if you leave it empty.">
          <Form.Item name="title" rules={[{ max: 150 }]}>
            <Input maxLength={150} showCount placeholder="e.g. 10 Marla Residential Plot in Sector B" />
          </Form.Item>
        </Field>

        <Field icon={<ProfileOutlined />} label="Description" hint="Location advantages, corner / park facing, road width, nearby landmarks, reason for selling.">
          <Form.Item name="description" rules={[{ max: 3000 }]}>
            <Input.TextArea rows={5} maxLength={3000} showCount placeholder="Describe your property, its features, the area it is in, etc." />
          </Form.Item>
        </Field>
      </FormBlock>

      <FormBlock icon={<EnvironmentOutlined />} title="Location" hint="DHA Gujranwala: choose the phase, sector and block.">
        <Field icon={<CompassOutlined />} label="Phase, sector and block">
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item name="phase_id" label="Phase">
                <Select
                  allowClear
                  placeholder="Select phase"
                  options={phases.map((phase) => ({ value: phase.id, label: phase.name }))}
                  onChange={() => form.setFieldsValue({ sector_id: null, block_id: null })}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="sector_id" label="Sector" rules={[{ required: (sectors.data ?? []).length > 0, message: "Choose the sector" }]}>
                <Select
                  allowClear
                  showSearch={{ optionFilterProp: "label" }}
                  disabled={sending || !phaseId}
                  loading={sectors.isFetching}
                  placeholder="Select sector"
                  options={(sectors.data ?? []).map((sector) => ({ value: sector.id, label: sector.name }))}
                  onChange={() => form.setFieldValue("block_id", null)}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="block_id" label="Block">
                <Select
                  allowClear
                  showSearch={{ optionFilterProp: "label" }}
                  disabled={sending || !sectorId || (blocks.data ?? []).length === 0}
                  loading={blocks.isFetching}
                  placeholder="Select block"
                  options={(blocks.data ?? []).map((block) => ({ value: block.id, label: block.name }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Field>

        <Field icon={<NumberOutlined />} label="Street and house / plot number">
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item name="street" rules={[{ max: 30 }]}>
                <Input placeholder="Street, e.g. 12" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item name="plot_number" rules={[{ max: 30 }]}>
                <Input placeholder="Plot / house, e.g. 245" suffix={<LockOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <div className="lf-private-note">
            <LockOutlined /> Private: only our team sees this. It is never shown on the website.
          </div>
        </Field>
      </FormBlock>

      <FormBlock icon={<DollarOutlined />} title="Pricing">
        <Field
          icon={<TagOutlined />}
          label={purpose === "rent" ? "Monthly rent (PKR)" : "Demand price (PKR)"}
          hint="Type the amount and pick Thousand, Lakh or Crore, e.g. 1.5 Crore or 45 Thousand."
        >
          <Form.Item
            name="price"
            rules={[{ required: true, message: purpose === "rent" ? "Enter the monthly rent" : "Enter your demand" }]}
            extra={price ? `= PKR ${`${price}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} (${formatCompactPrice(price)})` : undefined}
          >
            <PriceInput disabled={sending} />
          </Form.Item>
        </Field>
        <Field icon={<SwapOutlined />} label="Terms">
          <div className="lf-toggle">
            <div>
              <div className="lf-field-label">Price is negotiable</div>
              <div className="lf-field-hint">Buyers see that you are open to offers.</div>
            </div>
            <Form.Item name="is_negotiable" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
        </Field>
      </FormBlock>

      <FormBlock icon={<PictureOutlined />} title="Photos & Video" hint="Optional, but listings with photos sell much faster.">
        <Field icon={<PictureOutlined />} label="Upload images of your property">
          <div className="lf-upload">
            <div className="lf-upload-actions">
              <PictureOutlined className="lf-upload-art" />
              <Upload
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={sending || photos.length >= MAX_PHOTOS}
                showUploadList={false}
                beforeUpload={(file: UploadFile & File) => {
                  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
                    message.warning(`${file.name} is larger than ${MAX_PHOTO_MB}MB and was skipped.`);

                    return Upload.LIST_IGNORE;
                  }

                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    message.warning(`${file.name} is not a JPG, PNG or WebP image and was skipped.`);

                    return Upload.LIST_IGNORE;
                  }

                  addPhoto(file);

                  return false;
                }}
              >
                <Button type="primary" disabled={sending || photos.length >= MAX_PHOTOS}>
                  Upload images
                </Button>
              </Upload>
              <small>
                Up to {MAX_PHOTOS} · max {MAX_PHOTO_MB}MB · JPG, PNG or WebP
              </small>
            </div>
            <ul className="lf-upload-tips">
              <li>
                <CheckOutlined /> Ads with pictures get far more views.
              </li>
              <li>
                <CheckOutlined /> Add clear front, side and document images.
              </li>
              <li>
                <CheckOutlined /> The first photo is the cover; drag to reorder.
              </li>
            </ul>
          </div>

          {photos.length > 0 && (
            <SortableThumbs
              disabled={sending}
              items={photos.map((photo) => ({ key: photo.uid, src: photo.preview, alt: photo.name }))}
              onReorder={(keys) => setPhotos((current) => keys.map((key) => current.find((photo) => photo.uid === key)!))}
              onRemove={removePhoto}
            />
          )}

          <div style={{ marginTop: 12 }}>
            <QualityTip text={`Add at least ${Math.max(0, PHOTO_TARGET - photos.length)} more images`} current={photos.length} target={PHOTO_TARGET} />
          </div>
        </Field>

        <Field icon={<VideoCameraOutlined />} label="Add a video of your property" hint="Optional. Upload it to YouTube, Vimeo or TikTok and paste the link here.">
          <Form.Item name="video_url" rules={[{ type: "url", message: "Enter a full link starting with https://" }, { max: 500 }]}>
            <Input size="large" inputMode="url" prefix={<YoutubeFilled style={{ color: "#ff0000", fontSize: 18 }} aria-hidden />} placeholder="Paste a YouTube or Vimeo link, e.g. https://youtu.be/…" />
          </Form.Item>
        </Field>
      </FormBlock>

      <FormBlock icon={<UserOutlined />} title="Contact Information" hint="Our team calls you on this number to verify the property.">
        <Field icon={<UserOutlined />} label="Your name">
          <Form.Item name="name" rules={[{ required: true, whitespace: true, message: "Tell us your name" }, { min: 2 }, { max: 100 }]}>
            <Input placeholder="Full name" autoComplete="name" />
          </Form.Item>
        </Field>
        <Field icon={<PhoneOutlined />} label="Mobile / WhatsApp">
          <Form.Item name="phone" rules={[{ required: true, message: "We need a number to call you back" }]}>
            <Input placeholder="03xx-xxxxxxx" autoComplete="tel" inputMode="tel" />
          </Form.Item>
        </Field>
        <Field icon={<MailOutlined />} label="Email" hint="Optional.">
          <Form.Item name="email" rules={[{ type: "email", message: "Enter a valid email address" }]}>
            <Input placeholder="you@email.com" autoComplete="email" inputMode="email" />
          </Form.Item>
        </Field>
        <Field icon={<IdcardOutlined />} label="You are">
          <Form.Item name="owner_type" rules={[{ required: true }]}>
            <ChipGroup disabled={sending} options={OWNER_OPTIONS} />
          </Form.Item>
        </Field>

        {/* Hidden from people, irresistible to bots. */}
        <Form.Item name="website" hidden>
          <Input tabIndex={-1} autoComplete="off" />
        </Form.Item>
      </FormBlock>

      <FormBlock icon={<SafetyCertificateOutlined />} title="Confirm & Submit" hint="Our team reviews every submission before it goes live.">
        <Form.Item
          name="consent"
          valuePropName="checked"
          rules={[{ validator: (_, value: boolean) => (value ? Promise.resolve() : Promise.reject(new Error("Please confirm this to continue"))) }]}
        >
          <Checkbox>
            I confirm the information provided is accurate and I am authorized to list this property. I agree to be contacted by {siteName} regarding this listing.
          </Checkbox>
        </Form.Item>
        <div className="lf-footer">
          <Button type="primary" htmlType="submit" size="large" loading={sending}>
            {sending && photos.length > 0 ? "Uploading photos…" : "Submit Property for Review"}
          </Button>
        </div>
      </FormBlock>
    </Form>
  );
}
