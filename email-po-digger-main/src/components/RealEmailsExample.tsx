import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMatesEmails } from "@/hooks/useMatesEmails";
import { processEmail } from "@/lib/poAgent";
import { useState } from "react";

/**
 * Example component demonstrating how to use real emails from Supabase webhook
 * in the email-po-digger application.
 */
export function RealEmailsExample() {
  const { emails, isLoading, error, isDummyData, refreshEmails } = useMatesEmails();
  const [processedResults, setProcessedResults] = useState<Map<string, any[]>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleProcessEmails = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingError(null);

    try {
      const results = new Map<string, any[]>();

      for (const email of emails) {
        const { logs } = await processEmail(email);
        results.set(email.id, logs);
      }

      setProcessedResults(results);
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Failed to process emails");
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-900">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Loading emails...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mates Emails</h2>
          <p className="text-gray-600">
            Showing {emails.length} email{emails.length !== 1 ? "s" : ""} from Supabase webhook
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={refreshEmails} variant="outline">
            Refresh
          </Button>
          <Button onClick={handleProcessEmails} disabled={emails.length === 0 || isProcessing}>
            {isProcessing ? "Processing..." : "Process All"}
          </Button>
        </div>
      </div>

      {isDummyData && !isLoading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent>
            <p className="text-sm text-yellow-700">
              Supabase is unavailable or returned no emails, so fallback dummy emails are shown.
            </p>
          </CardContent>
        </Card>
      )}

      {processingError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent>
            <p className="text-sm text-red-700">{processingError}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {emails.map((email) => {
          const processedLogs = processedResults.get(email.id) || [];

          return (
            <Card key={email.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{email.subject}</CardTitle>
                    <CardDescription>
                      <div className="mt-2 space-y-1">
                        <p>
                          <span className="font-medium text-gray-700">From:</span> {email.sender}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">To:</span> {email.to}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Received:</span>{" "}
                          {new Date(email.receivedAt).toLocaleString()}
                        </p>
                      </div>
                    </CardDescription>
                  </div>
                  {email.isRealEmail && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Real Email
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Body Preview</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{email.body}</p>
                </div>

                {email.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      Attachments ({email.attachments.length})
                    </h4>
                    <div className="space-y-1">
                      {email.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <span>{att.name}</span>
                          <span className="text-gray-500">{att.sizeKb} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {processedLogs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Processing Results</h4>
                    <div className="space-y-2">
                      {processedLogs.map((log, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={log.status.includes("Rejected") ? "destructive" : "default"}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          {log.fileName && (
                            <p className="mt-1 text-gray-600">File: {log.fileName}</p>
                          )}
                          {log.reason && <p className="mt-1 text-gray-600">Reason: {log.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
