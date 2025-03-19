import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, LANGUAGES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Sparkles, User, Mail, Lock, Globe, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AuthResponse } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<string>("");

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      learningLanguages: [],
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      return await apiRequest<AuthResponse>('POST', '/api/auth/register', data);
    },
    onSuccess: (data) => {
      setAuth(data);
      toast({
        title: "Welcome to Talklocal!",
        description: "Your account has been created successfully.",
      });
      setLocation("/home");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Something went wrong",
      });
    },
  });

  const addLanguage = () => {
    if (currentLanguage && !selectedLanguages.includes(currentLanguage)) {
      const newLanguages = [...selectedLanguages, currentLanguage];
      setSelectedLanguages(newLanguages);
      form.setValue('learningLanguages', newLanguages);
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (code: string) => {
    const newLanguages = selectedLanguages.filter(l => l !== code);
    setSelectedLanguages(newLanguages);
    form.setValue('learningLanguages', newLanguages);
  };

  const onSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Join Talklocal
            </h1>
            <p className="text-muted-foreground text-lg">
              Start practicing languages today
            </p>
          </div>
        </div>

        {/* Registration Card */}
        <Card className="card-glass border-2 border-purple-500/20">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription className="text-base">
              Fill in your details to get started with language learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Enter your full name"
                            className="input-modern pl-11 h-12"
                            data-testid="input-name"
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
                            placeholder="At least 8 characters"
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

                {/* Language Selection */}
                <div className="space-y-4">
                  <FormLabel className="text-sm font-medium">Languages You Want to Practice (Optional)</FormLabel>
                  <div className="flex gap-3">
                    <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                      <SelectTrigger className="flex-1 input-modern h-12" data-testid="select-language">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Add a language..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={addLanguage}
                      disabled={!currentLanguage}
                      data-testid="button-add-language"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Selected Languages */}
                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-accent/30 rounded-xl border border-border/50">
                      {selectedLanguages.map((code) => {
                        const langInfo = LANGUAGES.find(l => l.code === code);
                        return (
                          <Badge
                            key={code}
                            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-foreground border border-purple-500/30 px-3 py-1 gap-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200"
                            data-testid={`badge-language-${code}`}
                          >
                            <span>{langInfo?.flag}</span>
                            <span>{langInfo?.name}</span>
                            <button
                              type="button"
                              onClick={() => removeLanguage(code)}
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              data-testid={`button-remove-${code}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full btn-primary h-12 text-base font-medium"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
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
            Already have an account?{" "}
            <Link href="/auth/login">
              <span className="font-medium text-purple-400 hover:text-purple-300 cursor-pointer transition-colors">
                Log in
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
