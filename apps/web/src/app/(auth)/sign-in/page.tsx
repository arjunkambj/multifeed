"use client";

import { useHexclaveApp } from "@hexclave/next";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Button, Input, InputOTP, Spinner } from "@heroui/react";

export default function SignInPage() {
  const app = useHexclaveApp();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [nonce, setNonce] = useState("");
  const [otp, setOtp] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");

  const handleSendMagicLink = async (
    source: "initial" | "resend" = "initial",
  ) => {
    if (source === "resend" && resendCooldown > 0) {
      return;
    }

    if (!email) {
      setMessage("Please enter your email address.");
      return;
    }

    setIsEmailLoading(true);
    setMessage("");

    try {
      const result = await app.sendMagicLinkEmail(email, {
        callbackUrl: `${window.location.origin}${app.urls.magicLinkCallback}`,
      });
      if (result.status === "error") {
        setMessage("Could not send verification code. Please try again.");
      } else {
        setNonce(result.data.nonce);
        setOtp("");
        setStep("otp");
        setResendCooldown(20);
        setMessage("Verification code sent. Check your email.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, resendCooldown]);

  useEffect(() => {
    if (otp.length !== 6 || isVerifying) return;

    const verify = async () => {
      setIsVerifying(true);
      try {
        const result = await app.signInWithMagicLink(otp + nonce);
        if (result.status === "error") {
          setMessage("Invalid code. Please try again.");
          setOtp("");
        }
      } catch {
        setMessage("Something went wrong. Please try again.");
        setOtp("");
      } finally {
        setIsVerifying(false);
      }
    };

    void verify();
  }, [otp, nonce, isVerifying, app]);

  return (
    <div className="flex w-full sm:max-w-sm flex-col gap-6 mx-auto">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Welcome to Unifeed
        </h1>
        <p className="mt-2 text-sm text-muted font-light">
          {step === "email"
            ? "Enter your email to continue"
            : `We sent a code to ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSendMagicLink("initial");
          }}
        >
          <div className="relative">
            <Icon
              icon="solar:letter-linear"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="secondary"
              className="h-10 text-base pl-10"
            />
          </div>

          <Button
            type="submit"
            isDisabled={isEmailLoading}
            size="lg"
            fullWidth
            className="font-normal"
          >
            {isEmailLoading ? <Spinner size="sm" /> : null}
            {isEmailLoading ? "Sending..." : "Continue with Email"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-5 pt-1">
          <p className="text-center text-sm text-muted font-light">
            Enter the 6-character code from your email
          </p>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value.toUpperCase())}
            isDisabled={isVerifying}
            className="w-full justify-center gap-3"
          >
            <InputOTP.Group>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTP.Slot key={index} index={index} />
              ))}
            </InputOTP.Group>
          </InputOTP>
          {isVerifying ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" />
              Verifying...
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-2 text-sm">
            <p className="text-xs text-muted">
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : "Didn't get the code?"}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={isEmailLoading || resendCooldown > 0}
                onClick={() => void handleSendMagicLink("resend")}
                className="font-medium"
              >
                {isEmailLoading ? "Sending..." : "Resend code"}
              </button>
              <span className="text-muted">|</span>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setNonce("");
                  setResendCooldown(0);
                }}
                className="font-medium"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      )}

      {message ? (
        <p className="rounded-lg border border-border bg-surface-secondary/60 px-3 py-2 text-center text-sm text-muted">
          {message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted font-medium">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="tertiary"
        isDisabled={isGoogleLoading}
        size="lg"
        fullWidth
        className="font-normal"
        onPress={async () => {
          setIsGoogleLoading(true);
          await app.signInWithOAuth("google", {
            returnTo: app.urls.afterSignIn,
          });
          setIsGoogleLoading(false);
        }}
      >
        {isGoogleLoading ? <Spinner size="sm" /> : <Icon icon="logos:google-icon" width={18} />}
        {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>

      <p className="text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Unifeed. All rights reserved.
      </p>
    </div>
  );
}
