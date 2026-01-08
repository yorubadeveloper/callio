import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="w-full px-4 flex items-center justify-center py-16 min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground">
              <Phone className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Welcome to Callio</CardTitle>
          <CardDescription className="text-sm">
            Sign in with Google to get started with your daily briefings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton />
          <p className="text-center text-xs sm:text-sm text-muted-foreground">
            By signing in, you agree to grant calendar access for daily briefings
          </p>
          <div className="text-center">
            <Link
              href="/"
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
