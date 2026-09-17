"use client";

import { MailOutlined, PhoneOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Result, Typography } from "antd";
import { useState } from "react";

type InquiryValues = { name: string; phone: string; email?: string; message: string; website?: string };

/** What the inquiry is about: a property listing (the default) or a developer project. */
type InquirySubject = "property" | "project";

export function InquiryForm({ slug, title, subject = "property" }: { slug: string; title: string; subject?: InquirySubject }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<InquiryValues>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const recipient = subject === "project" ? "developer" : "seller";

  async function onFinish(values: InquiryValues) {
    setSubmitting(true);

    try {
      const response = await fetch(subject === "project" ? `/api/projects/${encodeURIComponent(slug)}/leads` : `/api/leads/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setSent(true);

        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (response.status === 422 && payload.errors) {
        form.setFields(
          Object.entries(payload.errors as Record<string, string[]>).map(([name, errors]) => ({ name: name as keyof InquiryValues, errors })),
        );
      } else if (response.status === 429) {
        message.error("You have sent several messages recently. Please try again a little later.");
      } else {
        message.error(payload.message ?? "Your message could not be sent. Please try again.");
      }
    } catch {
      message.error("Your message could not be sent. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <Result
        status="success"
        title="Message sent"
        subTitle={`The ${recipient} will contact you soon.`}
        style={{ padding: "16px 0" }}
        extra={
          <Button
            onClick={() => {
              form.resetFields();
              setSent(false);
            }}
          >
            Send another message
          </Button>
        }
      />
    );
  }

  return (
    <>
      <Typography.Title level={4} style={{ margin: "0 0 4px" }}>
        Send a message
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        The {recipient} gets your details and replies directly.
      </Typography.Paragraph>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        initialValues={{ message: `Hi, I am interested in "${title}". Please contact me with more details.` }}
      >
        <Form.Item name="name" label="Your name" rules={[{ required: true, message: "Enter your name" }]}>
          <Input prefix={<UserOutlined />} autoComplete="name" />
        </Form.Item>
        <Form.Item name="phone" label="Mobile number" rules={[{ required: true, message: "Enter your mobile number" }]}>
          <Input prefix={<PhoneOutlined />} placeholder="03001234567" autoComplete="tel" inputMode="tel" />
        </Form.Item>
        <Form.Item name="email" label="Email (optional)" rules={[{ type: "email", message: "Enter a valid email" }]}>
          <Input prefix={<MailOutlined />} autoComplete="email" />
        </Form.Item>
        <Form.Item name="message" label="Message" rules={[{ required: true }, { min: 10, message: "Please write a little more" }]}>
          <Input.TextArea rows={4} maxLength={1000} showCount />
        </Form.Item>
        {/* Hidden from people; bots that fill it are ignored by the API. */}
        <Form.Item name="website" hidden>
          <Input tabIndex={-1} autoComplete="off" />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block icon={<SendOutlined />} loading={submitting}>
          Send message
        </Button>
      </Form>
    </>
  );
}
