"use client";

import { App, Button, Checkbox, Form, Input } from "antd";
import { useState } from "react";

type ContactValues = {
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  consent?: boolean;
  /** Hidden field that only bots fill in. */
  website?: string;
};

/**
 * The Contact page enquiry form. Posts through the site's own route so the API base URL and
 * throttling stay on the server.
 */
export function ContactForm({ consentText, successMessage }: { consentText: string | null; successMessage: string | null }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ContactValues>();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (values: ContactValues) => {
    setSending(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          subject: values.subject || undefined,
          message: values.message,
          website: values.website || undefined,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };

      if (!response.ok) {
        if (response.status === 422 && payload.errors) {
          form.setFields(
            Object.entries(payload.errors).map(([name, errors]) => ({ name: name as keyof ContactValues, errors })),
          );

          return;
        }

        message.error(payload.message ?? "Your message could not be sent. Please try again.");

        return;
      }

      form.resetFields();
      setSent(true);
    } catch {
      message.error("Your message could not be sent. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="contact-sent" role="status">
        <p>{successMessage ?? "Thank you — your message has been sent. We will be in touch shortly."}</p>
        <Button onClick={() => setSent(false)}>Send another message</Button>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
      <Form.Item name="name" label="Name" rules={[{ required: true, whitespace: true, message: "Tell us your name" }, { max: 100 }]}>
        <Input placeholder="Your full name" autoComplete="name" />
      </Form.Item>
      <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "We need a number to call you back" }]}>
        <Input placeholder="03001234567" autoComplete="tel" inputMode="tel" />
      </Form.Item>
      <Form.Item name="email" label="Email (optional)" rules={[{ type: "email", message: "Enter a valid email address" }]}>
        <Input placeholder="you@example.com" autoComplete="email" />
      </Form.Item>
      <Form.Item name="subject" label="Subject (optional)" rules={[{ max: 150 }]}>
        <Input placeholder="What is this about?" />
      </Form.Item>
      <Form.Item
        name="message"
        label="Message"
        rules={[{ required: true, whitespace: true, message: "Tell us how we can help" }, { min: 10, message: "Please write a little more" }, { max: 2000 }]}
      >
        <Input.TextArea rows={5} maxLength={2000} showCount placeholder="Tell us what you are looking for…" />
      </Form.Item>

      {/* Hidden from people, irresistible to bots. */}
      <Form.Item name="website" hidden>
        <Input tabIndex={-1} autoComplete="off" />
      </Form.Item>

      {consentText && (
        <Form.Item
          name="consent"
          valuePropName="checked"
          rules={[{ validator: (_, value: boolean) => (value ? Promise.resolve() : Promise.reject(new Error("Please accept this to continue"))) }]}
        >
          <Checkbox>{consentText}</Checkbox>
        </Form.Item>
      )}

      <Button type="primary" htmlType="submit" size="large" loading={sending} className="btn-block">
        Send message
      </Button>
    </Form>
  );
}
