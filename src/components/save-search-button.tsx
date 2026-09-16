"use client";

import { BellOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App, Button, Form, Input, Modal, Segmented } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { ApiError, clientApi } from "@/lib/client-api";
import type { AlertFrequency, Resource, SavedSearch } from "@/types/api";

type SaveValues = { name: string; alert_frequency: AlertFrequency };

export function SaveSearchButton({ filters, suggestedName, block = false }: { filters: Record<string, string>; suggestedName: string; block?: boolean }) {
  const { user, requireLogin } = useSession();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<SaveValues>();
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: (values: SaveValues) => {
      const savedFilters = { ...filters };
      delete savedFilters.page;

      return clientApi<Resource<SavedSearch>>("portal/saved-searches", { method: "POST", body: { ...values, filters: savedFilters } });
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      message.success(
        <span>
          Search saved. <Link href="/account/saved-searches">Manage alerts</Link>
        </span>,
      );
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors.name) {
        form.setFields([{ name: "name", errors: error.errors.name }]);
      } else {
        message.error(error.message);
      }
    },
  });

  return (
    <>
      <Button
        block={block}
        type={block ? "primary" : "default"}
        icon={<BellOutlined />}
        onClick={() => {
          if (!user) {
            requireLogin();

            return;
          }

          form.setFieldsValue({ name: suggestedName, alert_frequency: "daily" });
          setOpen(true);
        }}
      >
        Create alert
      </Button>
      <Modal title="Create a search alert" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={save.isPending} okText="Save" forceRender>
        <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
          <Form.Item name="name" label="Name" rules={[{ required: true }, { max: 100 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="alert_frequency" label="Email me when new listings match">
            <Segmented
              block
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "none", label: "Never" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
