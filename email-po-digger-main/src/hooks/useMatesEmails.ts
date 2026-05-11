import { useState, useEffect } from "react";
import type { Email, EmailFetchResult } from "../lib/poAgent";
import { getEmails } from "../lib/poAgent";

export function useMatesEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDummyData, setIsDummyData] = useState(false);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setIsLoading(true);
        const result: EmailFetchResult = await getEmails();
        setEmails(result.emails);
        setIsDummyData(result.isDummyData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch emails");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const refreshEmails = async () => {
    try {
      setIsLoading(true);
      const result: EmailFetchResult = await getEmails();
      setEmails(result.emails);
      setIsDummyData(result.isDummyData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh emails");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    emails,
    isLoading,
    error,
    isDummyData,
    refreshEmails,
  };
}
