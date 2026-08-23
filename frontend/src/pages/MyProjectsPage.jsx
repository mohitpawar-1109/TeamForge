import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, PlusCircle, Sparkles, Users } from 'lucide-react';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProjectCard } from '../components/cards/ProjectCard';
import { Button } from '../components/common/Button';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

export const MyProjectsPage = () => {
  const { user } = useAuth();
  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('created');

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        setLoading(true);
        const [createdRes, memberRes] = await Promise.all([
          projectAPI.getProjects({ owner: user?._id }),
          projectAPI.getProjects({ member: user?._id })
        ]);

        if (createdRes.data.success) {
          setCreatedProjects(createdRes.data.data);
        }
        if (memberRes.data.success) {
          const joined = memberRes.data.data.filter(p => p.owner?._id !== user?._id && p.owner !== user?._id);
          setJoinedProjects(joined);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyProjects();
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F5] tracking-tight">My Projects</h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1">
            Manage projects you created and collaborative teams you have joined.
          </p>
        </div>

        <Link to="/projects/create">
          <Button variant="primary" size="md" icon={PlusCircle}>
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#242424] pb-2">
        <button
          onClick={() => setTab('created')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
            tab === 'created'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          Created by You ({createdProjects.length})
        </button>
        <button
          onClick={() => setTab('joined')}
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
            tab === 'joined'
              ? 'bg-white text-black shadow-sm'
              : 'text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          Teams Joined ({joinedProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : tab === 'created' ? (
        createdProjects.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No projects created yet"
            description="Start by publishing your hackathon or engineering project idea to assemble your dream team."
            actionLabel="Create First Project"
            actionLink="/projects/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdProjects.map(p => (
              <ProjectCard key={p._id} project={p} showMatchScore={false} />
            ))}
          </div>
        )
      ) : (
        joinedProjects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams joined yet"
            description="Explore recruiting projects across university tracks or respond to incoming team invitations."
            actionLabel="Explore Projects"
            actionLink="/projects"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedProjects.map(p => (
              <ProjectCard key={p._id} project={p} showMatchScore={false} />
            ))}
          </div>
        )
      )}
    </div>
  );
};
