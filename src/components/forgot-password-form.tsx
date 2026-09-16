"use client";

import { MailOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";

type ForgotValues = { email: string };

/**
 * Buyer accounts share the users table with Property Admin, so the emailed link opens the reset page there;
 * after resetting, the buyer logs in here with the new password.
 */
export function ForgotPasswordForm() {
  const [form] = Form.useForm<ForgotValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ email: string; message: string } | null>(null);

  async function onFinish(values: ForgotValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        setSentTo({ email: values.email, message: payload.message ?? "If an account uses this email, we have sent it a password reset link." });

        return;
      }

      if (payload.errors) {
        form.setFields(Object.entries(payload.errors as Record<string, string[]>).map(([name, errors]) => ({ name: name as keyof ForgotValues, errors })));
      } else {
        setError(payload.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-card">
        <Typography.Title level={2} style={{ marginTop: 0 }}>
          Forgot your password?
        </Typography.Title>

        {sentTo ? (
          <>
            <Alert type="success" showIcon title="Check your email" description={sentTo.message} style={{ marginBottom: 16 }} />
            <Typography.Paragraph type="secondary">
              The link is valid for a limited time. Open it to choose a new password, then log in here with it. No email? Check your spam folder or{" "}
              <button type="button" className="link-button" onClick={() => setSentTo(null)}>
                try again
              </button>
              .
            </Typography.Paragraph>
            <Link href="/login">
              <Button type="primary" size="large" block>
                Back to log in
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Typography.Paragraph type="secondary">Enter the email address on your account and we will send you a link to reset your password.</Typography.Paragraph>

            {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

            <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
              <Form.Item
                name="email"
                label="Email address"
                rules={[
                  { required: true, message: "Enter your email address" },
                  { type: "email", message: "Enter a valid email address" },
                ]}
              >
                <Input prefix={<MailOutlined />} type="email" autoComplete="email" inputMode="email" maxLength={255} autoFocus />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={submitting}>
                Send reset link
              </Button>
            </Form>

            <Typography.Paragraph style={{ marginTop: 20, textAlign: "center" }}>
              Remembered it? <Link href="/login">Log in</Link>
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0, textAlign: "center" }}>
              Signed up with a phone number only? <Link href="/contact">Contact us</Link> and we will help you back in.
            </Typography.Paragraph>
          </>
        )}
      </div>
    </div>
  );
}
