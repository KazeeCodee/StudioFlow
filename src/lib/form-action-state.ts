import { ZodError } from "zod";

export type FormActionState = {
  status: "idle" | "error";
  message: string;
};

export const initialFormActionState: FormActionState = {
  status: "idle",
  message: "",
};

export function toFormActionError(
  error: unknown,
  fallbackMessage: string,
): FormActionState {
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: error.issues[0]?.message ?? fallbackMessage,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
  };
}

