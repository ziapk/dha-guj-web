"use client";

import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Col, Form, Input, Row, Typography } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type RegisterValues = { name: string; email?: string; phone?: string; password: string; password_confirmation: string };

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const queryClient = useQueryClient();
  const [form] = Form.useForm<RegisterValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: RegisterValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        router.replace(next);
        router.refresh();

        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (payload.errors) {
        form.setFields(Object.entries(payload.errors as Record<string, string[]>).map(([name, errors]) => ({ name: name as keyof RegisterValues, errors })));
      } else {
        setError(payload.message ?? "Registration failed. Please try again.");
      }
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <Typography.Title level={2} style={{ marginTop: 0 }}>
          Create your account
        </Typography.Title>
        <Typography.Paragraph type="secondary">Free forever for buyers and tenants.</Typography.Paragraph>

        {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

        <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} autoComplete="name" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                dependencies={["phone"]}
                rules={[
                  { type: "email" },
                  ({ getFieldValue }) => ({
                    validator: (_, value) => (value || getFieldValue("phone") ? Promise.resolve() : Promise.reject(new Error("Enter an email or a phone number"))),
                  }),
                ]}
              >
                <Input prefix={<MailOutlined />} autoComplete="email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Phone" dependencies={["email"]}>
                <Input prefix={<PhoneOutlined />} placeholder="03001234567" autoComplete="tel" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="password" label="Password" rules={[{ required: true }, { min: 8, message: "At least 8 characters" }]}>
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password_confirmation"
                label="Confirm password"
                dependencies={["password"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator: (_, value) => (!value || value === getFieldValue("password") ? Promise.resolve() : Promise.reject(new Error("Passwords do not match"))),
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Create account
          </Button>
        </Form>

        <Typography.Paragraph style={{ marginTop: 20, textAlign: "center", marginBottom: 0 }}>
          Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
        </Typography.Paragraph>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
