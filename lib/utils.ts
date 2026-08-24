import { toast } from "react-hot-toast";

export async function safeAsync<T>(
  promise: Promise<T>,
  errorMsg = "Terjadi kesalahan"
): Promise<T | null> {
  try {
    return await promise;
  } catch {
    toast.error(errorMsg);
    return null;
  }
}