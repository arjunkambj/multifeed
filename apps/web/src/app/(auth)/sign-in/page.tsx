"use client";

import { useHexclaveApp } from "@hexclave/next";
import { useEffect, useReducer, useRef } from "react";
import { Icon } from "@iconify/react";
import { Button, Input, InputOTP, Spinner, toast } from "@heroui/react";

type SignInState = {
  email: string;
  step: "email" | "otp";
  nonce: string;
  otp: string;
  isEmailLoading: boolean;
  isVerifying: boolean;
  isGoogleLoading: boolean;
  resendCooldown: number;
};

type SignInAction =
  | { type: "emailChanged"; value: string }
  | { type: "emailRequestStarted" }
  | { type: "emailRequestSucceeded"; email: string; nonce: string }
  | { type: "emailRequestFinished" }
  | { type: "otpChanged"; value: string }
  | { type: "verificationStarted" }
  | { type: "verificationFinished" }
  | { type: "cooldownTick" }
  | { type: "resetToEmail" }
  | { type: "googleRequestStarted" }
  | { type: "googleRequestFinished" };

const initialSignInState: SignInState = {
  email: "",
  step: "email",
  nonce: "",
  otp: "",
  isEmailLoading: false,
  isVerifying: false,
  isGoogleLoading: false,
  resendCooldown: 0,
};

function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case "emailChanged":
      return { ...state, email: action.value };
    case "emailRequestStarted":
      return { ...state, isEmailLoading: true };
    case "emailRequestSucceeded":
      return {
        ...state,
        email: action.email,
        nonce: action.nonce,
        otp: "",
        step: "otp",
        resendCooldown: 20,
      };
    case "emailRequestFinished":
      return { ...state, isEmailLoading: false };
    case "otpChanged":
      return { ...state, otp: action.value };
    case "verificationStarted":
      return { ...state, isVerifying: true };
    case "verificationFinished":
      return { ...state, otp: "", isVerifying: false };
    case "cooldownTick":
      return {
        ...state,
        resendCooldown: Math.max(state.resendCooldown - 1, 0),
      };
    case "resetToEmail":
      return {
        ...state,
        step: "email",
        nonce: "",
        otp: "",
        resendCooldown: 0,
      };
    case "googleRequestStarted":
      return { ...state, isGoogleLoading: true };
    case "googleRequestFinished":
      return { ...state, isGoogleLoading: false };
  }
}

export default function SignInPage() {
  "use no memo";

  const app = useHexclaveApp();
  const [state, dispatch] = useReducer(signInReducer, initialSignInState);
  const verificationPending = useRef(false);

  const handleSendMagicLink = async (
    source: "initial" | "resend" = "initial",
  ) => {
    if (source === "resend" && state.resendCooldown > 0) {
      return;
    }

    const normalizedEmail = state.email.trim();
    if (!normalizedEmail) {
      toast.danger("Please enter your email address.", { timeout: 3000 });
      return;
    }

    dispatch({ type: "emailRequestStarted" });

    void app
      .sendMagicLinkEmail(normalizedEmail, {
        callbackUrl: `${window.location.origin}${app.urls.magicLinkCallback}`,
      })
      .then((result) => {
        if (result.status === "error") {
          toast.danger("Could not send verification code. Please try again.", {
            timeout: 3000,
          });
          return;
        }
        dispatch({
          type: "emailRequestSucceeded",
          email: normalizedEmail,
          nonce: result.data.nonce,
        });
        toast.success("Verification code sent. Check your email.", {
          timeout: 3000,
        });
      })
      .catch(() => {
        toast.danger("Something went wrong. Please try again.", {
          timeout: 3000,
        });
      })
      .finally(() => dispatch({ type: "emailRequestFinished" }));
  };

  useEffect(() => {
    if (state.step !== "otp" || state.resendCooldown <= 0) return;

    const timer = window.setTimeout(() => {
      dispatch({ type: "cooldownTick" });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [state.step, state.resendCooldown]);

  useEffect(() => {
    if (state.otp.length !== 6 || verificationPending.current) return;
    verificationPending.current = true;
    let cancelled = false;

    const verify = async () => {
      dispatch({ type: "verificationStarted" });
      void app
        .signInWithMagicLink(state.otp + state.nonce)
        .then((result) => {
          if (!cancelled && result.status === "error") {
            toast.danger("Invalid code. Please try again.", { timeout: 3000 });
          }
        })
        .catch(() => {
          if (!cancelled) {
            toast.danger("Something went wrong. Please try again.", {
              timeout: 3000,
            });
          }
        })
        .finally(() => {
          if (!cancelled) dispatch({ type: "verificationFinished" });
          verificationPending.current = false;
        });
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [app, state.nonce, state.otp]);

  const handleGoogleSignIn = async () => {
    dispatch({ type: "googleRequestStarted" });
    void app
      .signInWithOAuth("google", {
        returnTo: app.urls.afterSignIn,
      })
      .catch(() => {
        toast.danger("Could not continue with Google. Please try again.", {
          timeout: 3000,
        });
      })
      .finally(() => dispatch({ type: "googleRequestFinished" }));
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Welcome to MultiFeed
        </h1>
        <p className="mt-2 text-sm font-light text-muted">
          {state.step === "email"
            ? "Sign in to run social on autopilot"
            : `We sent a code to ${state.email}`}
        </p>
      </div>

      {state.step === "email" ? (
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              type="email"
              placeholder="you@example.com"
              value={state.email}
              onChange={(e) =>
                dispatch({ type: "emailChanged", value: e.target.value })
              }
              required
              fullWidth
              className="h-10 text-base pl-10"
            />
          </div>

          <Button
            type="submit"
            isDisabled={state.isEmailLoading}
            size="lg"
            fullWidth
            className="font-normal"
          >
            {state.isEmailLoading ? <Spinner size="sm" /> : null}
            {state.isEmailLoading ? "Sending..." : "Continue with Email"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-5 pt-1">
          <p className="text-center text-sm text-muted font-light">
            Enter the 6-character code from your email
          </p>
          <InputOTP
            maxLength={6}
            value={state.otp}
            onChange={(value) =>
              dispatch({ type: "otpChanged", value: value.toUpperCase() })
            }
            isDisabled={state.isVerifying}
            className="w-full justify-center gap-3"
          >
            <InputOTP.Group>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTP.Slot key={index} index={index} />
              ))}
            </InputOTP.Group>
          </InputOTP>
          {state.isVerifying ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" />
              Verifying...
            </div>
          ) : null}
          <div className="flex flex-col items-center gap-2 text-sm">
            <p className="text-xs text-muted">
              {state.resendCooldown > 0
                ? `Resend available in ${state.resendCooldown}s`
                : "Didn't get the code?"}
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={state.isEmailLoading || state.resendCooldown > 0}
                onClick={() => void handleSendMagicLink("resend")}
                className="font-medium"
              >
                {state.isEmailLoading ? "Sending..." : "Resend code"}
              </button>
              <span className="text-muted">|</span>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "resetToEmail" });
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
        <span className="text-xs text-muted font-medium">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        variant="tertiary"
        isDisabled={state.isGoogleLoading}
        size="lg"
        fullWidth
        className="font-normal"
        onPress={handleGoogleSignIn}
      >
        {state.isGoogleLoading ? (
          <Spinner size="sm" />
        ) : (
          <Icon icon="logos:google-icon" width={18} />
        )}
        {state.isGoogleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>

      <p className="text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} MultiFeed. All rights reserved.
      </p>
    </div>
  );
}
