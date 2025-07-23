'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { useRealTimeTrainingVideos } from '@/hooks/useRealTimeData';

export default function TrainingVideosPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Always call hooks before any early returns
  const { data: videos, loading, error, refresh } = useRealTimeTrainingVideos();

  // Check access - allow retailers and employees
  if (!session || !['RETAILER', 'EMPLOYEE'].includes(session.user.role)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers and employees can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'ALL' || video.category === selectedCategory;
    const matchesLevel = selectedLevel === 'ALL' || video.level === selectedLevel;
    const matchesSearch = searchTerm === '' || 
      video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesLevel && matchesSearch && video.is_active;
  });

  // Get unique categories and levels
  const categories = ['ALL', ...new Set(videos.map(v => v.category).filter(Boolean))];
  const levels = ['ALL', ...new Set(videos.map(v => v.level).filter(Boolean))];

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-600';
      case 'intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'advanced': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (videoUrl: string) => {
    const videoId = getVideoId(videoUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder-video.png';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">🎥 Training Videos</h1>
          <p className="text-red-100">Learn and improve your skills with our training content</p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>{videos.length} Videos Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="🔍 Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'ALL' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level === 'ALL' ? 'All Levels' : level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button 
              onClick={refresh} 
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading training videos...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">❌ Error loading videos: {error}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'ALL' || selectedLevel !== 'ALL'
                  ? 'No videos found matching your criteria.'
                  : 'No training videos available yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                      <CardDescription className="mt-1">{video.category}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className={getLevelColor(video.level)}>
                        {video.level}
                      </Badge>
                      {video.duration_minutes && (
                        <Badge variant="outline" className="text-xs">
                          ⏱️ {formatDuration(video.duration_minutes)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <img 
                      src={getThumbnailUrl(video.video_url)} 
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-video.png';
                      }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {video.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                    <div>
                      <span>Added:</span>
                      <span className="ml-1 font-medium">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span>Views:</span>
                      <span className="ml-1 font-medium">
                        {video.view_count || 0}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => window.open(video.video_url, '_blank')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    ▶️ Watch Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
