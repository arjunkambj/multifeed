"use client";

import { useHexclaveApp } from "@hexclave/next";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

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
  const verificationPending = useRef(false);

  const handleSendMagicLink = async (
    source: "initial" | "resend" = "initial",
  ) => {
    if (source === "resend" && resendCooldown > 0) {
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsEmailLoading(true);

    try {
      const result = await app.sendMagicLinkEmail(normalizedEmail, {
        callbackUrl: `${window.location.origin}${app.urls.magicLinkCallback}`,
      });
      if (result.status === "error") {
        toast.error("Could not send verification code. Please try again.");
      } else {
        setEmail(normalizedEmail);
        setNonce(result.data.nonce);
        setOtp("");
        setStep("otp");
        setResendCooldown(20);
        toast.success("Verification code sent. Check your email.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
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
    if (otp.length !== 6 || verificationPending.current) return;
    verificationPending.current = true;
    let cancelled = false;

    const verify = async () => {
      setIsVerifying(true);
      try {
        const result = await app.signInWithMagicLink(otp + nonce);
        if (!cancelled && result.status === "error") {
          toast.error("Invalid code. Please try again.");
        }
      } catch {
        if (!cancelled) {
          toast.error("Something went wrong. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setOtp("");
          setIsVerifying(false);
        }
        verificationPending.current = false;
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [app, nonce, otp]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await app.signInWithOAuth("google", {
        returnTo: app.urls.afterSignIn,
      });
    } catch {
      toast.error("Could not continue with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Welcome to MultiFeed
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          {step === "email"
            ? "Sign in to run social on autopilot"
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
              width={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-base pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={isEmailLoading}
            size="lg"
            className="w-full font-normal"
          >
            {isEmailLoading ? <Spinner className="size-4" /> : null}
            Continue with Email
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-5 pt-1">
          <p className="text-center text-sm text-muted-foreground font-light">
            Enter the 6-character code from your email
          </p>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value.toUpperCase())}
            disabled={isVerifying}
            containerClassName="justify-center gap-2"
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="rounded-xl"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {isVerifying ? (
            <Skeleton className="h-5 w-32" aria-label="Verifying..." />
          ) : null}
          <div className="flex flex-col items-center gap-2 text-sm">
            <p className="text-xs text-muted-foreground">
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
              <span className="text-muted-foreground">|</span>
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

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="secondary"
        disabled={isGoogleLoading}
        size="lg"
        className="w-full font-normal"
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <Spinner className="size-4" />
        ) : (
          <Icon icon="logos:google-icon" width={18} />
        )}
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} MultiFeed. All rights reserved.
      </p>
    </div>
  );
}
