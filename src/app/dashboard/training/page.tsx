'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useRealTimeTrainingVideos } from '@/hooks/useRealTimeData';

export default function TrainingPage() {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Use real-time data hook
  const { data: videos, loading, error, refresh } = useRealTimeTrainingVideos(true);

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const trackVideoView = async (videoId: string) => {
    try {
      await fetch('/api/training-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId })
      });
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const handleVideoClick = (video: any) => {
    trackVideoView(video.id);
    window.open(video.video_url, '_blank');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-600';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'Advanced': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Filter videos based on search and filters
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'ALL' || video.category === selectedCategory;
    const matchesLevel = selectedLevel === 'ALL' || video.level === selectedLevel;
    const matchesSearch = searchTerm === '' ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesLevel && matchesSearch;
  });

  const categories = [...new Set(videos.map(video => video.category).filter(Boolean))];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <h1 className="text-4xl font-bold mb-3">Training Videos</h1>
          <p className="text-red-100 text-xl">
            Learn and improve your skills with our comprehensive training library
          </p>
          <div className="mt-4 flex items-center gap-4 text-red-100">
            <span>📹 {videos.length} Videos Available</span>
            <span>•</span>
            <span>🎯 Real-time Updates</span>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Videos</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="ALL">All Levels</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={refresh}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading training videos...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Videos</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'ALL' || selectedLevel !== 'ALL'
                  ? 'Try adjusting your search or filters.'
                  : 'No training videos are available yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-red-600 transition-colors">
                        {video.title}
                      </CardTitle>
                      <CardDescription>{video.category}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(video.level)}`}>
                      {video.level}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-video.jpg';
                      }}
                    />
                  )}

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {video.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      {video.duration_minutes && (
                        <span className="text-sm text-gray-500">⏱️ {video.duration_minutes} min</span>
                      )}
                      <span className="text-sm text-gray-500">👁️ {video.view_count || 0} views</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleVideoClick(video)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    ▶️ Watch Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{videos.length}</div>
                <div className="text-sm text-gray-600">Total Videos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{filteredVideos.length}</div>
                <div className="text-sm text-gray-600">Filtered Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {videos.reduce((total, video) => total + (video.view_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}