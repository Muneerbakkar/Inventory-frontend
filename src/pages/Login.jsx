import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { useLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Eye, EyeOff, Mail, Lock, Zap } from "lucide-react";

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      setErrorMsg("");
      const result = await login(data).unwrap();
      dispatch(setCredentials({ user: result.data.user, token: result.token }));
      navigate("/");
    } catch (err) {
      setErrorMsg(err.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel: Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-12 md:px-24 lg:w-3/5 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Logo Section */}
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">InventoryApp</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Log in to your account.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and password to log in.
          </p>

          {errorMsg && (
            <div className="mt-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10 h-11"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 h-11 pr-10"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              
              <div className="flex justify-end pt-1">
                <a href="#" className="text-sm font-semibold text-primary hover:text-primary/80">
                  Forgot password?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground uppercase tracking-wider">Or</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-11 font-medium bg-background text-foreground hover:bg-muted border-border">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11 font-medium bg-background text-foreground hover:bg-muted border-border">
              <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
              Facebook
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't you have an account?{" "}
            <Link to="#" className="font-semibold text-primary hover:text-primary/80">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Feature Graphic */}
      <div className="hidden lg:flex lg:w-2/5 p-4">
        <div className="relative flex w-full h-full flex-col justify-end overflow-hidden rounded-3xl bg-muted/50 border border-border shadow-2xl">
          
          {/* Background Decorative Circles */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="absolute bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl"></div>
          
          {/* Floating Tilted Square */}
          <div className="absolute top-12 left-12 h-32 w-32 rounded-3xl border border-foreground/5 bg-foreground/5 rotate-12 backdrop-blur-sm"></div>

          {/* Pure CSS Abstract Dashboard Illustration */}
          <div className="absolute inset-0 flex items-center justify-center p-12 mb-24">
            
            <div className="relative w-full max-w-lg aspect-video rounded-xl border border-foreground/10 bg-background/40 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col">
              {/* Window Header */}
              <div className="flex items-center gap-1.5 border-b border-foreground/10 bg-foreground/5 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20"></div>
              </div>
              
              {/* Window Body */}
              <div className="flex flex-1 p-4 gap-4">
                {/* Sidebar */}
                <div className="w-1/4 rounded-lg bg-foreground/5 p-3 flex flex-col gap-3">
                  <div className="h-2 w-3/4 rounded-full bg-foreground/20"></div>
                  <div className="h-2 w-full rounded-full bg-foreground/10"></div>
                  <div className="h-2 w-5/6 rounded-full bg-foreground/10"></div>
                  <div className="h-2 w-full rounded-full bg-foreground/10"></div>
                  <div className="mt-auto h-6 w-full rounded-md bg-foreground/10"></div>
                </div>
                
                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Chart Area */}
                  <div className="flex-1 rounded-lg bg-foreground/5 p-4 flex items-end justify-between gap-2">
                    <div className="w-full bg-foreground/10 rounded-t-sm h-[20%]"></div>
                    <div className="w-full bg-foreground/20 rounded-t-sm h-[40%]"></div>
                    <div className="w-full bg-foreground/10 rounded-t-sm h-[30%]"></div>
                    <div className="w-full bg-foreground/20 rounded-t-sm h-[60%]"></div>
                    <div className="w-full bg-foreground/30 rounded-t-sm h-[80%]"></div>
                    <div className="w-full bg-foreground/20 rounded-t-sm h-[50%]"></div>
                  </div>
                  
                  {/* Bottom Cards */}
                  <div className="flex gap-4 h-24">
                    <div className="flex-1 rounded-lg bg-foreground/5 p-3 relative overflow-hidden">
                       <div className="h-2 w-1/2 rounded-full bg-foreground/20"></div>
                       <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-foreground/5"></div>
                    </div>
                    <div className="flex-1 rounded-lg bg-foreground/5 p-3 relative overflow-hidden">
                       <div className="h-2 w-1/2 rounded-full bg-foreground/20"></div>
                       <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-primary/20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Icon Box */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-xl bg-foreground text-background shadow-xl rotate-3 transform transition-transform hover:rotate-6">
              <Zap className="h-8 w-8" />
            </div>

          </div>

          {/* Graphic Overlay Text */}
          <div className="relative z-10 px-12 pb-16 text-center text-foreground">
            <h3 className="text-4xl font-bold tracking-tight mb-3">
              The easiest way to manage<br />your workflow.
            </h3>
            <p className="text-muted-foreground text-lg">
              Join the Inventory community now!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
