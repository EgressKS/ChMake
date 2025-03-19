import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Globe, Users, MessageSquare, Trophy, Sparkles, Star, ArrowRight, Play, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card-glass backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Talklocal
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="btn-ghost">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="btn-primary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/5 to-pink-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container relative z-10 mx-auto px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card-glass backdrop-blur-sm px-6 py-3 shadow-lg">
                <Star className="h-4 w-4 text-purple-400 fill-current" />
                <span className="text-sm font-medium text-foreground">Real-time voice chat for language learners</span>
              </div>

              {/* Main heading */}
              <div className="space-y-4">
                <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight">
                  <span className="block bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                    Practice Languages
                  </span>
                  <span className="block bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Through Conversation
                  </span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="mx-auto max-w-3xl text-xl text-muted-foreground leading-relaxed">
                Join Talklocal to connect with native speakers and language learners worldwide.
                Practice speaking in real-time voice rooms designed for comfortable, immersive learning.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
                <Link href="/auth/register">
                  <Button size="lg" className="btn-primary text-lg px-8 py-4 gap-3 shadow-2xl">
                    <Mic className="h-6 w-6" />
                    Start Speaking Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/rooms">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-4 gap-3 border-2 hover:bg-accent/50">
                    <Play className="h-5 w-5" />
                    Browse Rooms
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                How <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Talklocal</span> Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start practicing your target language in three simple steps
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: Globe,
                  title: "Choose Your Language",
                  description: "Select the language you want to practice and your proficiency level",
                  gradient: "from-blue-500 to-purple-500"
                },
                {
                  step: "02",
                  icon: Users,
                  title: "Join a Room",
                  description: "Find active voice rooms or create your own conversation topic",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  step: "03",
                  icon: Mic,
                  title: "Start Speaking",
                  description: "Practice with native speakers and learners in real-time audio conversations",
                  gradient: "from-pink-500 to-rose-500"
                }
              ].map((item, index) => (
                <Card key={index} className="card-modern group hover:scale-105 animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="text-sm font-mono text-muted-foreground mb-2">{item.step}</div>
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="mb-4 text-2xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Features Built for <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Learners</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to improve your language skills through conversation
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MessageSquare,
                  title: "Real-time Chat",
                  description: "Text chat alongside voice for vocabulary help and context",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Users,
                  title: "Friend Network",
                  description: "Connect with language partners and build lasting learning relationships",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: Trophy,
                  title: "Learning Streaks",
                  description: "Track your progress and maintain motivation with daily practice streaks",
                  gradient: "from-amber-500 to-orange-500"
                },
                {
                  icon: Mic,
                  title: "Voice Quality",
                  description: "Crystal-clear P2P audio with WebRTC for natural conversations",
                  gradient: "from-emerald-500 to-teal-500"
                },
                {
                  icon: Globe,
                  title: "12+ Languages",
                  description: "Practice English, Spanish, French, German, and many more",
                  gradient: "from-indigo-500 to-purple-500"
                },
                {
                  icon: Sparkles,
                  title: "Host Controls",
                  description: "Create your own rooms with full moderation capabilities",
                  gradient: "from-rose-500 to-pink-500"
                }
              ].map((item, index) => (
                <Card key={index} className="card-modern group hover:scale-105 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <Card className="card-glass border-2 border-purple-500/20">
              <CardContent className="p-16 text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                    Ready to Start Speaking?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join thousands of language learners practicing together every day
                  </p>
                </div>
                <Link href="/auth/register">
                  <Button size="lg" className="btn-primary text-lg px-12 py-6 shadow-2xl">
                    Join Talklocal Free
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Talklocal
              </span>
            </div>
            <p className="text-muted-foreground">
              © 2025 Talklocal. Practice languages through conversation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
