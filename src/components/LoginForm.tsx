import { Eye, EyeOff, KeyRound, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type LoginFormProps = {
  email: string;
  password: string;
  loading: boolean;
  flash: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function LoginForm(props: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[22rem]">
      <div className="mb-8 flex items-center justify-center gap-2 text-white">
        <div className="flex size-6 items-center justify-center rounded-md border border-white/25 bg-white/10">
          <span className="text-xs font-semibold">V</span>
        </div>
        <span className="text-sm font-semibold">Voice App</span>
      </div>

      <Card className="border-white/10 bg-[#171717] py-0 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
        <CardHeader className="px-6 pb-4 pt-7 text-center">
          <CardTitle className="text-3xl font-semibold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="pt-1 text-sm text-[#a7a7a7]">
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-white">
              Email
            </Label>
            <Input
              id="login-email"
              className="h-11 border-white/15 bg-[#222222] text-white placeholder:text-[#7d7d7d]"
              placeholder="m@example.com"
              value={props.email}
              onChange={(event) => props.onEmailChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-white">
                Password
              </Label>
              <button type="button" className="text-sm text-white/80 hover:text-white">
                Forgot your password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#7d7d7d]" />
              <Input
                id="login-password"
                className="h-11 border-white/15 bg-[#222222] pl-9 pr-10 text-white placeholder:text-[#7d7d7d]"
                type={showPassword ? "text" : "password"}
                placeholder=""
                value={props.password}
                onChange={(event) => props.onPasswordChange(event.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8d8d8d] transition hover:text-white"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cfcfcf]">
            {props.flash}
          </div>

          <Button
            className="h-11 w-full bg-[#e5e5e5] text-black hover:bg-white"
            size="lg"
            disabled={props.loading}
            onClick={props.onSubmit}
          >
            <LogIn className="size-4" />
            {props.loading ? "Loading..." : "Login"}
          </Button>

          <p className="text-center text-sm text-[#9a9a9a]">
            Don&apos;t have an account?{" "}
            <button type="button" className="text-white underline underline-offset-2">
              Sign up
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
