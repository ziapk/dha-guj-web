"use client";

import { Alert, Button, Form, Input } from "antd";
import Link from "next/link";
import { useState } from "react";
import { AuthCard, AuthDivider } from "@/components/auth-card";
import { ArrowLeftIcon, ArrowRightIcon, MailIcon } from "@/components/icons";

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

  if (sentTo) {
    return (
      <AuthCard title="Check your email" intro={sentTo.message}>
        <p className="auth-intro">
          The link is valid for a limited time. Open it to choose a new password, then log in here with it. No email? Check your spam folder or{" "}
          <button type="button" className="link-button" onClick={() => setSentTo(null)}>
            try again
          </button>
          .
        </p>
        <BackToLogin />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot Password?" intro="Enter your registered email address and we'll send you a link to reset your password.">
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

      <Form
        form={form}
        layout="vertical"
        size="large"
        className="auth-form"
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span className="auth-required">*</span>}
          </>
        )}
        onFinish={onFinish}
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: "Enter your email address" },
            { type: "email", message: "Enter a valid email address" },
          ]}
        >
          <Input prefix={<MailIcon className="icon auth-input-icon" />} placeholder="Enter your email address" type="email" autoComplete="email" inputMode="email" maxLength={255} autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting} icon={<ArrowRightIcon className="icon" />} iconPlacement="end">
          Send Reset Link
        </Button>
      </Form>

      <AuthDivider>OR</AuthDivider>
      <BackToLogin />

      <p className="auth-footnote">
        Signed up with a phone number only? <Link href="/contact">Contact us</Link> and we will help you back in.
      </p>
    </AuthCard>
  );
}

function BackToLogin() {
  return (
    <Link href="/login" className="auth-secondary-button">
      <ArrowLeftIcon className="icon" /> Back to Login
    </Link>
  );
}
