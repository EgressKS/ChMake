import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUserSchema, type LoginUser, type AuthResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mic, Loader2, Sparkles, ArrowRight, Mail, Lock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      return await apiRequest<AuthResponse>('POST', '/api/auth/login', data);
    },
    onSuccess: (data) => {
      setAuth(data);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
    },
  });

  const onSubmit = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg">
              Log in to continue your language journey
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="card-glass border-2 border-purple-500/20">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Log In</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="input-modern pl-11 h-12"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="input-modern pl-11 h-12"
                            data-testid="input-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full btn-primary h-12 text-base font-medium"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/register">
              <span className="font-medium text-purple-400 hover:text-purple-300 cursor-pointer transition-colors">
                Sign up
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
