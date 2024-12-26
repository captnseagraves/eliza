import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ApiError } from "@/lib/api/client";

interface Props {
  children: React.ReactNode;
  error: unknown;
  resetError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

function getErrorTitle(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 422:
        return "Validation Error";
      case 500:
        return "Server Error";
      default:
        return "Error";
    }
  }
  return "Error";
}

export function ApiErrorDisplay({ error, resetError }: Props) {
  const { reset } = useQueryErrorResetBoundary();

  const handleReset = () => {
    reset();
    resetError();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-red-600">{getErrorTitle(error)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{getErrorMessage(error)}</p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleReset}>Try Again</Button>
      </CardFooter>
    </Card>
  );
}
