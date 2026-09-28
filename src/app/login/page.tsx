"use client";

import { LockOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthCard, AuthDivider } from "@/components/auth-card";
import { HomeIcon, UserIcon } from "@/components/icons";
import { portalUrl } from "@/lib/site";

type LoginValues = { login: string; password: string };

/** Only return to pages on this site, never to another host. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const queryClient = useQueryClient();
  const [form] = Form.useForm<LoginValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFinish(values: LoginValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        router.replace(next);
        router.refresh();

        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (payload.errors) {
        form.setFields(Object.entries(payload.errors as Record<string, string[]>).map(([name, errors]) => ({ name: name as keyof LoginValues, errors })));
      } else {
        setError(payload.message ?? "Login failed. Please try again.");
      }
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Log in" intro="Save your favourite properties and get updates when new listings match your interests.">
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish} className="auth-form">
        <Form.Item name="login" label="Email or phone number" rules={[{ required: true, message: "Enter your email or phone number" }]}>
          <Input prefix={<UserIcon className="icon auth-input-icon" />} placeholder="Enter your email or phone number" autoComplete="username" autoFocus />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter your password" }]}>
          <Input.Password prefix={<LockOutlined className="auth-input-icon" />} placeholder="Enter your password" autoComplete="current-password" />
        </Form.Item>
        <div className="auth-links">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Log in
        </Button>
      </Form>

      <AuthDivider>New here?</AuthDivider>
      <Link href={`/register?next=${encodeURIComponent(next)}`} className="auth-cta-link">
        Create a free account
      </Link>

      <div className="auth-note">
        <HomeIcon className="icon" />
        <span>
          Looking to list a property? <a href={portalUrl("/listings/new")}>List Property</a>
        </span>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
