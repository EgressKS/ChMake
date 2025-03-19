import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Clock, Star, Users, Play } from "lucide-react";

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  type: 'lesson' | 'exercise' | 'video' | 'article';
  duration: string;
  rating: number;
  participants: number;
  completed: boolean;
}

export default function Library() {
  // Mock study materials data - in real app this would come from API
  const studyMaterials: StudyMaterial[] = [
    {
      id: '1',
      title: 'Basic Spanish Greetings',
      description: 'Learn essential greetings and introductions in Spanish',
      language: 'Spanish',
      level: 'beginner',
      type: 'lesson',
      duration: '15 min',
      rating: 4.8,
      participants: 1250,
      completed: true
    },
    {
      id: '2',
      title: 'French Pronunciation Guide',
      description: 'Master French sounds and pronunciation rules',
      language: 'French',
      level: 'beginner',
      type: 'video',
      duration: '25 min',
      rating: 4.6,
      participants: 890,
      completed: false
    },
    {
      id: '3',
      title: 'German Grammar Exercises',
      description: 'Practice German sentence structure and grammar',
      language: 'German',
      level: 'intermediate',
      type: 'exercise',
      duration: '30 min',
      rating: 4.4,
      participants: 567,
      completed: false
    },
    {
      id: '4',
      title: 'Italian Culture & Customs',
      description: 'Understanding Italian social norms and traditions',
      language: 'Italian',
      level: 'intermediate',
      type: 'article',
      duration: '20 min',
      rating: 4.7,
      participants: 723,
      completed: false
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />;
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'exercise':
        return <Users className="h-4 w-4" />;
      case 'article':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Study Library</h1>
        <p className="text-slate-400">Access lessons, exercises, and resources to improve your language skills</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search lessons, exercises..."
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder-slate-400"
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          Filter
        </Button>
      </div>

      {/* Study Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studyMaterials.map((material) => (
          <Card key={material.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    {getTypeIcon(material.type)}
                  </div>
                  <Badge className={getLevelColor(material.level)}>
                    {material.level}
                  </Badge>
                </div>
                {material.completed && (
                  <Badge className="bg-green-500/20 text-green-400">
                    Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-white text-lg">{material.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {material.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {material.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {material.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {material.participants}
                  </div>
                </div>
              </div>
              <Button
                className={`w-full ${material.completed ? 'bg-slate-700 hover:bg-slate-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                disabled={material.completed}
              >
                {material.completed ? 'Review' : 'Start Learning'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {studyMaterials.length === 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No study materials yet</h3>
            <p className="text-slate-400 text-center mb-4">
              Start exploring language learning resources and exercises.
            </p>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Browse Available Content
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
