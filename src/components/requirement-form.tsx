"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, AutoComplete, Button, Empty, Form, Input, InputNumber, Segmented, Select, Skeleton, Space } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session-provider";
import { ApiError, clientApi } from "@/lib/client-api";
import { AREA_UNIT_LABELS, PROPERTY_CATEGORY_LABELS, formatCompactPrice, toOptions } from "@/lib/labels";
import type { MasterData } from "@/lib/master-data";
import type { AreaUnit, Collection, Phase, PropertyCategory, PropertyPurpose, Resource, WantedPost, WantedPostApproval } from "@/types/api";

type Values = {
  purpose: PropertyPurpose;
  property_type_id?: number | null;
  city_id?: number | null;
  society_id?: number | null;
  phase?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_area?: number | null;
  max_area?: number | null;
  area_unit?: AreaUnit | null;
  bedrooms?: number | null;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string | null;
};

const FIELDS: (keyof Values)[] = [
  "purpose",
  "property_type_id",
  "city_id",
  "society_id",
  "phase",
  "min_price",
  "max_price",
  "min_area",
  "max_area",
  "area_unit",
  "bedrooms",
  "description",
  "contact_name",
  "contact_phone",
  "contact_email",
];

const numberOrNull = (value: string | null | undefined) => (value === null || value === undefined || value === "" ? null : Number(value));

function valuesOf(post: WantedPost): Values {
  return {
    purpose: post.purpose,
    property_type_id: post.property_type?.id ?? null,
    city_id: post.city?.id ?? null,
    society_id: post.society?.id ?? null,
    phase: post.phase,
    min_price: numberOrNull(post.min_price),
    max_price: numberOrNull(post.max_price),
    min_area: numberOrNull(post.min_area),
    max_area: numberOrNull(post.max_area),
    area_unit: post.area_unit ?? "marla",
    bedrooms: post.bedrooms,
    description: post.description,
    contact_name: post.contact?.name,
    contact_phone: post.contact?.phone,
    contact_email: post.contact?.email ?? null,
  };
}

/** Every field is sent (empty ones as null) so clearing a field on edit really clears it. */
function payloadOf(values: Values): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of FIELDS) {
    const value = values[field];
    payload[field] = value === undefined || (typeof value === "string" && value.trim() === "") ? null : typeof value === "string" ? value.trim() : value;
  }

  if (payload.min_area === null && payload.max_area === null) {
    payload.area_unit = null;
  }

  return payload;
}

const thousands = (value: number | string | undefined) => (value === undefined || value === "" ? "" : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
const parseThousands = (value: string | undefined) => Number((value ?? "").replace(/[^\d.]/g, "")) || 0;

function PriceHint({ value }: { value: number | null | undefined }) {
  return value ? <span className="form-hint">{formatCompactPrice(value)}</span> : null;
}

/** Create (no id) or edit a buyer requirement. */
export function RequirementForm({ id, cities, societies, propertyTypes }: MasterData & { id?: number }) {
  const { user, isLoading, requireLogin } = useSession();
  const isEdit = id !== undefined;

  const post = useQuery({
    queryKey: ["my-wanted-posts", id],
    queryFn: () => clientApi<Resource<WantedPost>>(`portal/my-wanted-posts/${id}`).then((response) => response.data),
    enabled: isEdit && Boolean(user),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  if (!isLoading && !user) {
    return (
      <Empty description="Log in to post and manage your requirements">
        <Button type="primary" onClick={requireLogin}>
          Log in
        </Button>
      </Empty>
    );
  }

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (isEdit) {
    if (post.isError) {
      return (
        <Empty description={post.error instanceof ApiError && post.error.status === 404 ? "This requirement no longer exists." : "Could not load this requirement."}>
          <Link href="/account/requirements">
            <Button type="primary">Back to my requirements</Button>
          </Link>
        </Empty>
      );
    }

    if (!post.data) {
      return <Skeleton active paragraph={{ rows: 10 }} />;
    }
  }

  return (
    <RequirementFields
      key={post.data?.id ?? "new"}
      id={id}
      initial={post.data ? valuesOf(post.data) : undefined}
      isOpen={post.data?.is_open ?? true}
      approval={post.data?.approval_status}
      cities={cities}
      societies={societies}
      propertyTypes={propertyTypes}
    />
  );
}

function RequirementFields({
  id,
  initial,
  isOpen,
  approval,
  cities,
  societies,
  propertyTypes,
}: MasterData & { id?: number; initial?: Values; isOpen: boolean; approval?: WantedPostApproval }) {
  const { user } = useSession();
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<Values>();
  const [limitError, setLimitError] = useState<string | null>(null);
  const isEdit = id !== undefined;

  const cityId = Form.useWatch("city_id", form);
  const societyId = Form.useWatch("society_id", form);
  const purpose = Form.useWatch("purpose", form);
  const minPrice = Form.useWatch("min_price", form);
  const maxPrice = Form.useWatch("max_price", form);
  const propertyTypeId = Form.useWatch("property_type_id", form);
  const isPlot = propertyTypes.find((type) => type.id === propertyTypeId)?.category === "plot";

  // Prefill the contact details from the account for a new requirement, unless the buyer already typed them.
  useEffect(() => {
    if (isEdit || !user || form.isFieldsTouched(["contact_name", "contact_phone", "contact_email"])) {
      return;
    }

    form.setFieldsValue({ contact_name: user.name, contact_phone: user.phone ?? undefined, contact_email: user.email ?? undefined });
  }, [form, isEdit, user]);

  const phases = useQuery({
    queryKey: ["phases", societyId],
    enabled: Boolean(societyId),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch(`/api/phases?society_id=${societyId}`);

      return response.ok ? ((await response.json()) as Collection<Phase>).data : [];
    },
  });

  const save = useMutation({
    mutationFn: (values: Values) =>
      isEdit
        ? clientApi<Resource<WantedPost>>(`portal/my-wanted-posts/${id}`, { method: "PUT", body: payloadOf(values) })
        : clientApi<Resource<WantedPost>>("portal/my-wanted-posts", { method: "POST", body: payloadOf(values) }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["my-wanted-posts"] });
      message.success(
        response.data.approval_status === "pending"
          ? `${isEdit ? "Requirement updated" : "Requirement posted"}. Our team will review it before sellers can see it.`
          : "Requirement updated",
      );
      router.push("/account/requirements");
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || error.status !== 422) {
        message.error(error.message);

        return;
      }

      // The API reports the open-requirements limit as a plain 422 message (code WANTED_POST_LIMIT), not a field error.
      const limit = /open requirements/i.test(error.message)
        ? error.message
        : (error.errors.description ?? []).find((text) => /open requirements/i.test(text));
      setLimitError(limit ?? null);

      const fieldErrors = Object.entries(error.errors)
        .filter(([name]) => FIELDS.includes(name as keyof Values))
        .map(([name, errors]) => ({ name: name as keyof Values, errors: limit && name === "description" ? errors.filter((text) => text !== limit) : errors }))
        .filter((field) => field.errors.length > 0);

      form.setFields(fieldErrors);

      if (limit) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (fieldErrors[0]) {
        form.scrollToField(fieldErrors[0].name, { behavior: "smooth", block: "center" });
      }
    },
  });

  const typeOptions = (Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[])
    .map((category) => ({
      label: PROPERTY_CATEGORY_LABELS[category],
      options: propertyTypes.filter((type) => type.category === category).map((type) => ({ value: type.id, label: type.name })),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <Form<Values>
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={initial ?? { purpose: "sale", area_unit: "marla" }}
      onFinish={(values) => {
        setLimitError(null);
        save.mutate(values);
      }}
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
      className="requirement-form"
    >
      {limitError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          title="You already have 5 open requirements"
          description={
            <>
              {limitError} <Link href="/account/requirements">Manage your requirements</Link>
            </>
          }
        />
      )}

      {isEdit && approval === "approved" && isOpen && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          title="Changing the details sends it for review again"
          description="Sellers stop seeing it until our team approves the changes."
        />
      )}

      {isEdit && !isOpen && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          title="This requirement is not visible to sellers"
          description="Saving your changes does not reopen it. Use “Reopen” on the list to show it for another 30 days."
        />
      )}

      <fieldset className="form-section">
        <legend>What are you looking for?</legend>
        <Form.Item name="purpose" label="I want to" rules={[{ required: true }]}>
          <Segmented
            options={[
              { value: "sale", label: "Buy" },
              { value: "rent", label: "Rent" },
            ]}
          />
        </Form.Item>
        <Form.Item name="property_type_id" label="Property type">
          <Select allowClear showSearch={{ optionFilterProp: "label" }} placeholder="Any type" options={typeOptions} />
        </Form.Item>
      </fieldset>

      <fieldset className="form-section">
        <legend>Location</legend>
        <div className="form-grid">
          <Form.Item name="city_id" label="City" rules={[{ required: true, message: "Choose a city" }]}>
            <Select
              showSearch={{ optionFilterProp: "label" }}
              placeholder="Choose a city"
              options={cities.map((city) => ({ value: city.id, label: city.name }))}
              onChange={() => form.setFieldsValue({ society_id: null, phase: null })}
            />
          </Form.Item>
          <Form.Item name="society_id" label="Society">
            <Select
              allowClear
              showSearch={{ optionFilterProp: "label" }}
              disabled={!cityId}
              placeholder={cityId ? "Any society" : "Choose a city first"}
              options={societies.filter((society) => society.city_id === cityId).map((society) => ({ value: society.id, label: society.name }))}
              onChange={() => form.setFieldsValue({ phase: null })}
            />
          </Form.Item>
          <Form.Item name="phase" label="Phase" rules={[{ max: 50 }]} extra={societyId ? undefined : "Choose a society to see its phases, or type one."}>
            <AutoComplete
              allowClear
              placeholder="Any phase"
              options={(phases.data ?? []).map((phase) => ({ value: phase.name }))}
              showSearch={{ filterOption: (input, option) => String(option?.value ?? "").toLowerCase().includes(input.toLowerCase()) }}
            />
          </Form.Item>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Budget and size</legend>
        <div className="form-grid">
          <Form.Item name="min_price" label={`Minimum budget (Rs${purpose === "rent" ? " / month" : ""})`} extra={<PriceHint value={minPrice} />}>
            <InputNumber<number> min={0} step={purpose === "rent" ? 5000 : 500000} style={{ width: "100%" }} placeholder="No minimum" formatter={thousands} parser={parseThousands} />
          </Form.Item>
          <Form.Item
            name="max_price"
            label={`Maximum budget (Rs${purpose === "rent" ? " / month" : ""})`}
            dependencies={["min_price"]}
            extra={<PriceHint value={maxPrice} />}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || !getFieldValue("min_price") || value >= getFieldValue("min_price") ? Promise.resolve() : Promise.reject(new Error("Must be at least the minimum budget")),
              }),
            ]}
          >
            <InputNumber<number> min={0} step={purpose === "rent" ? 5000 : 500000} style={{ width: "100%" }} placeholder="No maximum" formatter={thousands} parser={parseThousands} />
          </Form.Item>
        </div>
        <div className="form-grid form-grid-area">
          <Form.Item name="min_area" label="Minimum area">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="Any" />
          </Form.Item>
          <Form.Item
            name="max_area"
            label="Maximum area"
            dependencies={["min_area"]}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || !getFieldValue("min_area") || value >= getFieldValue("min_area") ? Promise.resolve() : Promise.reject(new Error("Must be at least the minimum area")),
              }),
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="Any" />
          </Form.Item>
          <Form.Item name="area_unit" label="Unit">
            <Select options={toOptions(AREA_UNIT_LABELS)} />
          </Form.Item>
        </div>
        {!isPlot && (
          <Form.Item name="bedrooms" label="Bedrooms (at least)">
            <Select
              allowClear
              placeholder="Any"
              style={{ maxWidth: 240 }}
              options={[1, 2, 3, 4, 5, 6].map((value) => ({ value, label: `${value}+ bedrooms` }))}
            />
          </Form.Item>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Details</legend>
        <Form.Item
          name="description"
          label="Describe what you need"
          rules={[
            { required: true, message: "Tell sellers what you are looking for" },
            { min: 10, message: "Write at least 10 characters" },
            { max: 2000 },
          ]}
        >
          <Input.TextArea rows={5} showCount maxLength={2000} placeholder="e.g. 10 marla house near a park, corner preferred, ready to move in within 2 months." />
        </Form.Item>
      </fieldset>

      <fieldset className="form-section">
        <legend>Contact details</legend>
        <p className="form-section-note">Only sellers who unlock your requirement in Property Admin can see these.</p>
        <div className="form-grid">
          <Form.Item name="contact_name" label="Name" rules={[{ required: true, whitespace: true }, { max: 100 }]}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item name="contact_phone" label="Phone" rules={[{ required: true, whitespace: true }, { max: 20 }]}>
            <Input autoComplete="tel" inputMode="tel" placeholder="03001234567" />
          </Form.Item>
          <Form.Item name="contact_email" label="Email" rules={[{ type: "email" }, { max: 255 }]}>
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>
        </div>
      </fieldset>

      <Space wrap>
        <Button type="primary" htmlType="submit" size="large" loading={save.isPending}>
          {isEdit ? "Save changes" : "Post requirement"}
        </Button>
        <Link href="/account/requirements">
          <Button size="large">Cancel</Button>
        </Link>
      </Space>
    </Form>
  );
}
